import Nodes as nodes
import Relationships as Relationships
import extractAllASNs as extractAllASNs
import getAfricanLocationsPerASN as getAfricanLocationsPerASN
import getIXPs as getIXPs
import copy
import json

AfricaTotals={}

def extractASFromCone(year):
    # MUST DO
    print("Fetching ASNs, organisations and cone size")
    AfricanAses = extractAllASNs.getAllASNs("./backend/files/"+str(year)+"/"+str(year)+".ppdc-ases.txt")
    print("ASNs, organisations and cone size fetched")
    #The Following is optional: save progress
    temp = open("./backend/files/"+str(year)+"/ASNORGCONE.json","w")
    temp.write(json.dumps(AfricanAses))
    temp.close()
    return AfricanAses

def reloadextraction(year):
    # USE WHEN extractASFromCone(year) has already been done for year
    print("Fetching ASNs, organisations and cone size")
    f = open("./backend/files/"+str(year)+"/ASNORGCONE.json",'r')
    AfricanAses = json.load(f)
    f.close()
    print("ASNs, organisations and cone size fetched")
    return AfricanAses

def getAfricaLocationsAfterExtraction(year,AfricanAses):
    # MUST DO
    print("Fetching location data")
    AfricanAses,AfricaTotals = getAfricanLocationsPerASN.getLocations(AfricanAses)
    print("Locations fetched and total ASN count completed")
    # Optional SAVE
    newtemp =open("./backend/files/"+str(year)+"/LOCATIONS.json","w")
    newtemp.write(json.dumps(AfricanAses))
    newtemp.flush()
    newtemp.close()
    newtemp =open("./backend/files/"+str(year)+"/TOTALS.json","w")
    newtemp.write(json.dumps(AfricaTotals))
    newtemp.flush()
    newtemp.close()
    return AfricanAses,AfricaTotals

def reloadLocations(year):
    # USE WHEN getAfricaLocationsAfterExtraction(year) DONE
    print("Fetching location data")
    f = open("./backend/files/"+str(year)+"/LOCATIONS.json",'r')
    AfricanAses = json.load(f)
    f.close()
    f = open("./backend/files/"+str(year)+"/TOTALS.json",'r')
    AfricaTotals = json.load(f)
    f.close()
    print("Locations fetched and total ASN count completed")
    return AfricanAses,AfricaTotals

def getIXPForASN(AfricanAses):
    #MUST DO
    print("Fetching IXPs")
    dictAs = copy.deepcopy(AfricanAses)
    AfricanIXPs= getIXPs.prepareIXPs(dictAs)
    print("IXPs prepared with direct ASN customers")
    return AfricanIXPs

def makeRelationshipsForYear(year, AfricanAses):
    #MUST DO
    print("Creating relationships")
    AfricanAses = Relationships.makeRelationships(AfricanAses,"./backend/files/"+str(year)+"/"+str(year)+".as-rel.txt")
    print("Relationships between ASes created")
    newtemp =open("./backend/files/"+str(year)+"/RELATIONSHIPS.json","w")
    newtemp.write(json.dumps(AfricanAses))
    newtemp.flush()
    newtemp.close()
    return AfricanAses

def reloadRelationships(year):
    # USE WHEN makeRelationshipsForYear(year,AfricanAses) DONE
    print("Creating relationships")
    f = open("./backend/files/"+str(year)+"/RELATIONSHIPS.json",'r')
    AfricanAses = json.load(f)
    f.close()
    print("Relationships between ASes created")
    return AfricanAses

'''WriteASNS takes in the year processed, a dictionary of ASNs processed, and the tallys of ASNs in African countries, and writes ASNs to a json file.
It is worth noting that since the ASNs are sorted from largest to smallest cone, as they are written to the file, their quartile level in Africa is determined by dividing incrementing the count of the number of African ASes processed. This number is then divided by the African total, returning a figure between 0 and 1. If it is <0.25 it is in the top 25% and has level 1, else if it is <0.5 it is in the top 50% and has level 2, else if it is <0.75 it is in the top 75% and has level 3, else it has level 4. This is done similarly for each country to divide the ASNs in the country into 4 quartiles arranged by cone size'''

def writeASNS(year,AfricanAses,AfricaTotals):
    WriterCounter = {'Africa':0,'DZA': 0, 'AGO': 0, 'SHN': 0, 'BEN': 0, 'BWA': 0, 'BFA': 0, 'BDI': 0, 'CMR': 0, 'CPV': 0, 'CAF': 0, 'TCD': 0, 'COM': 0, 'COG': 0, 'COD': 0, 'DJI': 0, 'EGY': 0, 'GNQ': 0, 'ERI': 0, 'SWZ': 0, 'ETH': 0, 'GAB': 0, 'GMB': 0, 'GHA': 0, 'GIN': 0, 'GNB': 0, 'CIV': 0, 'KEN': 0, 'LSO': 0, 'LBR': 0, 'LBY': 0, 'MDG': 0, 'MWI': 0, 'MLI': 0, 'MRT': 0, 'MUS': 0, 'MYT': 0, 'MAR': 0, 'MOZ': 0, 'NAM': 0, 'NER': 0, 'NGA': 0, 'STP': 0, 'REU': 0, 'RWA': 0, 'SEN': 0, 'SYC': 0, 'SLE': 0, 'SOM': 0, 'ZAF': 0, 'SSD': 0, 'SDN': 0, 'TZA': 0, 'TGO': 0, 'TUN': 0, 'UGA': 0, 'ZMB': 0, 'ZWE': 0}
    f = open("./backend/ASNS/"+str(year)+".json","w")
    f.write("[")
    f.flush()
    first =True
    for AS in AfricanAses.keys():
        currentASN = AfricanAses[AS]
        locations = currentASN["locations"]
        for code in locations.keys():
            WriterCounter['Africa']+=1
            WriterCounter[code]+=1
            AfricaLevel = WriterCounter['Africa']/AfricaTotals['Africa']
            CountryLevel = WriterCounter[code]/AfricaTotals[code]
            
            if AfricaTotals['Africa']<4:
                AfricaLevel=WriterCounter['Africa']
            elif AfricaLevel<=0.25:
                AfricaLevel=1
            elif AfricaLevel<=0.5:
                AfricaLevel=2
            elif AfricaLevel<=0.75:
                AfricaLevel=3
            else:
                AfricaLevel=4
            
            if AfricaTotals[code]<4:
                CountryLevel=WriterCounter[code]
            elif CountryLevel<=0.25:
                CountryLevel=1
            elif CountryLevel<=0.5:
                CountryLevel=2
            elif CountryLevel<=0.75:
                CountryLevel=3
            else:
                CountryLevel=4


            newAS = nodes.ASN(str(str(AS)+"_"+code),locations[code]["latitude"],locations[code]["longitude"],code,currentASN["relationships"],CountryLevel,AfricaLevel)
            if first:
                f.write(str(newAS))
                first=False
            else:
                f.write(","+str(newAS))
            f.flush()
    f.write("]")
    f.close()
    print("ASNs written to file")

def writeIXPS(year,AfricanIXPs):
    f = open("./backend/IXPS/"+str(year)+".json","w")
    f.write("[")
    first = True
    f.flush()
    for IXPID in AfricanIXPs.keys():
        currentIXP = AfricanIXPs[IXPID]
        newIXP= nodes.IXP(str(IXPID),currentIXP['name'],currentIXP['country'],currentIXP['latitude'],currentIXP['longitude'],currentIXP['customers'])
        if first:
            first=False
            f.write(str(newIXP))
        else:
            f.write(","+str(newIXP))
        f.flush()
    f.write("]")
    f.close()
    print("IXPs written to a file")


def prepData(yeartoprocess):
    ASDict = extractASFromCone(yeartoprocess)
    print("1")
    ASDict,AfricaTotals= getAfricaLocationsAfterExtraction(yeartoprocess,ASDict)
    print("2")
    IXPDict =getIXPForASN(ASDict)
    ASDict=makeRelationshipsForYear(yeartoprocess,ASDict)
    print("3")
    writeASNS(yeartoprocess,ASDict,AfricaTotals)
    writeIXPS(yeartoprocess,IXPDict)

def errorOne(yeartoprocess):
    ASDict = reloadextraction(yeartoprocess)
    print("1")
    ASDict,AfricaTotals= getAfricaLocationsAfterExtraction(yeartoprocess,ASDict)
    print("2")
    IXPDict =getIXPForASN(ASDict)
    ASDict=makeRelationshipsForYear(yeartoprocess,ASDict)
    print("3")
    writeASNS(yeartoprocess,ASDict,AfricaTotals)
    writeIXPS(yeartoprocess,IXPDict)


def errorTwo(yeartoprocess):
    ASDict = reloadextraction(yeartoprocess)
    print("1")
    ASDict,AfricaTotals= reloadLocations(yeartoprocess)
    print("2")
    IXPDict =getIXPForASN(ASDict)
    ASDict=makeRelationshipsForYear(yeartoprocess,ASDict)
    print("3")
    writeASNS(yeartoprocess,ASDict,AfricaTotals)
    writeIXPS(yeartoprocess,IXPDict)
    
def errorThree(yeartoprocess):
    ASDict = reloadextraction(yeartoprocess)
    print("1")
    ASDict,AfricaTotals= reloadLocations(yeartoprocess)
    print("2")
    IXPDict =getIXPForASN(ASDict)
    ASDict=reloadRelationships(yeartoprocess)
    print("3")
    writeASNS(yeartoprocess,ASDict,AfricaTotals)
    writeIXPS(yeartoprocess,IXPDict)
    
if __name__=="__main__":
    #PIP3 INSTALL THE FOLLOWING:
    #flask, flask_cors
    #aiohttp, asyncio
    #country-converter
    #geoip2
    #Shapely
    #for year in range(1998,1999):
    try:
        prepData(1111)
        print("YASSSSS QUEEEEEEN")
        print("Finished",1111)
        print("YASSSSS QUEEEEEEN")
    except Exception as e:
        print(e)
        print("ERROR ERROR ERROR ERROR")
        print("Please redo data processing for",1111)
        print("ERROR ERROR ERROR ERROR")
        #continue