import requests 
import json
import asyncio
import aiohttp
import math
import country_converter as coco
from random import random
tCount=0
from shapely.geometry import shape,Point
asns=[]
cc = coco.CountryConverter()
featurefile = open('./customgeo.json','r')
js = json.load(featurefile)
featurefile.close()
async def getASNsperIXP(IXP, session):
    async with session.get("https://www.pch.net/api/ixp/subnet_details/"+IXP) as response:
            return [(await response.json()),IXP]

async def run(r):
    tasks = []

    async with aiohttp.ClientSession() as session:
        for i in r:
            task = asyncio.ensure_future(getASNsperIXP(i, session))
            tasks.append(task)
        responses = await asyncio.gather(*tasks)
    return responses


def prepareIXPs(AfricanASes):
    response=requests.get("https://www.pch.net/api/ixp/directory/Active")
    ixps=response.json()
    AfricanIXPs={}     
    for ixp in ixps:
        if ixp["reg"]=="Africa" :
            country=cc.convert((ixp['ctry']),to="ISO3")
            lat=eval(ixp['lat'])
            lon=eval(ixp['lon'])
            lat,lon = randompt(lat,lon,country)
            AfricanIXPs[ixp['id']]={"country":country,"name":ixp['name'], "latitude":lat,"longitude":lon}
    AfricanIXPList = list(AfricanIXPs)
    max = math.ceil(len(AfricanIXPList)/100)
    for i in range(0,max):
        if i!=max-1:
            IXPSubset= AfricanIXPList[(100*(i)):(100*(i+1))]
        else:
            IXPSubset= AfricanIXPList[((max-1)*100):]
        loop = asyncio.get_event_loop()
        future = asyncio.ensure_future(run(IXPSubset))
        loop.run_until_complete(future)
        results = future.result()
        for ixparr in results:
            ixpid=ixparr[1]
            ixp = ixparr[0]
            ASNsFound={}
            ASNsforIXPList=[]
            for iptype in ixp:
                if iptype == "IPv4":
                    for subnetipv4 in ixp[iptype]:                    
                        for prefixipv4 in ixp[iptype][subnetipv4]:
                            try:
                                if str(ixp[iptype][subnetipv4][prefixipv4]['asn'])!="None":
                                    if (not (str(ixp[iptype][subnetipv4][prefixipv4]['asn'])in ASNsFound)):
                                        ASNsFound[str(ixp[iptype][subnetipv4][prefixipv4]['asn'])]=True
                                        if str(ixp[iptype][subnetipv4][prefixipv4]['asn']) in AfricanASes:
                                            asn = str(ixp[iptype][subnetipv4][prefixipv4]['asn'])
                                            asLocations=AfricanASes[asn]["locations"].keys()
                                            for location in asLocations:
                                                ASNsforIXPList.append("ASN_"+asn+"_"+location)
                            except:
                                if str(prefixipv4['asn'])!="None":
                                    if (not (str(prefixipv4['asn'])in ASNsFound)):
                                        ASNsFound[str(prefixipv4['asn'])]=True
                                        if str(prefixipv4['asn']) in AfricanASes:
                                            asn = str(prefixipv4['asn'])
                                            asLocations=AfricanASes[asn]["locations"].keys()
                                            for location in asLocations:
                                                ASNsforIXPList.append("ASN_"+asn+"_"+location)        
                elif iptype == "IPv6":

                    for subnetipv6 in ixp[iptype]:
                                                
                        for prefixipv6 in ixp[iptype][subnetipv6]:
                            if str(ixp[iptype][subnetipv6][prefixipv6]['asn']) == "None":
                                print(type(ixp[iptype][subnetipv6][prefixipv6]['asn']))
                            if str(ixp[iptype][subnetipv6][prefixipv6]['asn']) != "None":
                                if (not (str(ixp[iptype][subnetipv6][prefixipv6]['asn']) in ASNsFound)):
                                    ASNsFound[str(ixp[iptype][subnetipv6][prefixipv6]['asn'])]=True
                                    if str(ixp[iptype][subnetipv6][prefixipv6]['asn']) in AfricanASes:
                                        asn = str(ixp[iptype][subnetipv6][prefixipv6]['asn'])
                                        asLocations=AfricanASes[asn]["locations"].keys()
                                        for location in asLocations:
                                            ASNsforIXPList.append("ASN_"+asn+"_"+location)
                else:
                    continue
            AfricanIXPs[ixpid]["customers"]=ASNsforIXPList
    return AfricanIXPs
def randompt(x0, y0,country):
    
    
    inCountry = ((country=="MUS") or (country=="SYC"))
    

    r = 50/111.3
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