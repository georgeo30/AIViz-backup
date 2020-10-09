import time
import aiohttp
import asyncio
import geoip2.database
import math
from random import random
import country_converter as coco
import json
from shapely.geometry import shape,Point
cc = coco.CountryConverter()
Africa=["DZ","AO","SH","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","DJ","EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","CI","KE","LS","LR","LY","MG","MW","ML","MR","MU","YT","MA","MZ","NA","NE","NG","ST","RE","RW","ST","SN","SC","SL","SO","ZA","SS","SH","SD","SZ","TZ","TG","TN","UG","CD","ZM","TZ","ZW"]
AfricaCounter = {'Africa':0,'DZA': 0, 'AGO': 0, 'SHN': 0, 'BEN': 0, 'BWA': 0, 'BFA': 0, 'BDI': 0, 'CMR': 0, 'CPV': 0, 'CAF': 0, 'TCD': 0, 'COM': 0, 'COG': 0, 'COD': 0, 'DJI': 0, 'EGY': 0, 'GNQ': 0, 'ERI': 0, 'SWZ': 0, 'ETH': 0, 'GAB': 0, 'GMB': 0, 'GHA': 0, 'GIN': 0, 'GNB': 0, 'CIV': 0, 'KEN': 0, 'LSO': 0, 'LBR': 0, 'LBY': 0, 'MDG': 0, 'MWI': 0, 'MLI': 0, 'MRT': 0, 'MUS': 0, 'MYT': 0, 'MAR': 0, 'MOZ': 0, 'NAM': 0, 'NER': 0, 'NGA': 0, 'STP': 0, 'REU': 0, 'RWA': 0, 'SEN': 0, 'SYC': 0, 'SLE': 0, 'SOM': 0, 'ZAF': 0, 'SSD': 0, 'SDN': 0, 'TZA': 0, 'TGO': 0, 'TUN': 0, 'UGA': 0, 'ZMB': 0, 'ZWE': 0}
featurefile = open('./backend/customgeo.json','r')
js = json.load(featurefile)

def inAfrica(code):
    return (code.upper() in Africa)

async def getPrefixes(AS, session): 
    #lol
    try:
        async with session.get("https://stat.ripe.net/data/ris-prefixes/data.json?resource="+AS+"&list_prefixes=true&types=o&noise=filter&soft_limit=ignore") as response:
            return [await response.json(),AS]
    except:
        async with session.get("https://stat.ripe.net/data/ris-prefixes/data.json?resource="+AS+"&list_prefixes=true&types=o&noise=filter&soft_limit=ignore") as response:
            return [await response.json(),AS]

async def run(r):
    tasks = []

    async with aiohttp.ClientSession() as session:
        for i in r:
            task = asyncio.ensure_future(getPrefixes(i, session))
            tasks.append(task)

        responses = await asyncio.gather(*tasks)
    return responses

def getLocations(ASNDictionary):
    AllASes = [*ASNDictionary]
    size =1000
    max = math.ceil(len(AllASes)/1000)
    # print(max)
    start = time.time()
    for i in range (0,max):
        if i!=max-1:
            ASNSubset= AllASes[(1000*(i)):(1000*(i+1))]
        else:
            ASNSubset= AllASes[((max-1)*1000):]
        print("Percentage complete: ",100*i/max)
        loop1 = asyncio.get_event_loop()
        future = asyncio.ensure_future(run(ASNSubset))
        loop1.run_until_complete(future)
        client= geoip2.database.Reader("./GeoLite2-City.mmdb")
        results = future.result()
        for arr in results:
            result=arr[0]
            currentASNfromarr =arr[1]
            countAfricanAddress =0
            try:
                currentASN=result["data"]["resource"]
                prefixes=result["data"]["prefixes"]["v4"]["originating"]
            except KeyError:
                del ASNDictionary[currentASNfromarr]
                continue
            
            
            ASNDictionary[currentASN]["locations"]={}
            asndictoflocations=ASNDictionary[currentASN]["locations"]
            for address in prefixes:
                address=address[0:address.index("/")]
                try:
                    response = client.city(address)
                    if response.country.iso_code==None:
                        continue
                    if (not (inAfrica(response.country.iso_code))):
                        continue
                    countAfricanAddress+=1
                    iso3code = cc.convert(response.country.iso_code,to="ISO3")
                    if(iso3code in asndictoflocations):
                        currentCountryMap = asndictoflocations[iso3code]
                        if (eval(str(response.location.accuracy_radius))<eval(currentCountryMap["accuracy"])):
                            currentCountryMap["latitude"]=str(response.location.latitude)
                            currentCountryMap["longitude"]=str(response.location.longitude)
                            currentCountryMap["accuracy"]=str(response.location.accuracy_radius)
                    else:
                        asndictoflocations[iso3code]={"accuracy":str(response.location.accuracy_radius),"latitude":str(response.location.latitude),"longitude":str(response.location.longitude)}
                        AfricaCounter['Africa']+=1
                        AfricaCounter[iso3code]+=1

                except:
                    continue
            if(countAfricanAddress==0):
                del ASNDictionary[currentASN]
            else:
                for location in asndictoflocations.keys():
                    centerlat= eval(asndictoflocations[location]["latitude"])
                    centerlong= eval(asndictoflocations[location]["longitude"])
                    radius = eval(asndictoflocations[location]["accuracy"])
                    newlat,newlong=randompt(centerlat,centerlong,radius,location)
                    asndictoflocations[location]["latitude"]=str(newlat)
                    asndictoflocations[location]["longitude"]=str(newlong)
    return ASNDictionary, AfricaCounter


if __name__ == "__main__":
    client= geoip2.database.Reader("./backend/GeoLite2-City.mmdb")
    response= client.city("41.114.255.57")
    print(response.country)

def randompt(x0, y0,radius,country):
    
    
    inCountry = ((country=="MUS") or (country=="SYC"))
    # inCountry=False

    r = max(radius,50)/111.3
    newX=x0
    newY=y0
    attempts=0
    while(inCountry==False and attempts<100):
        u = random()
        v = random()
        w = r * math.sqrt(u)
        t = 2 * math.pi * v
        x = w * math.cos(t)
        y1 = w * math.sin(t)
        x1 = x / math.cos(y0)
     
        newY = y0 + y1
        newX = x0 + x1

        point = Point(newY,newX)

        for feature in js['features']:
            if (feature['properties']['adm0_a3'] == country):
                polygon = shape(feature['geometry'])
                if polygon.contains(point):
                    inCountry=True
                else:
                    r=r-0.1*r
        attempts+=1

    if attempts==100:
        return x0,y0
    return newX,newY    