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
    AfricanAses = extractAllASNs.getAllASNs("./backend/files/"+str(year)+"/"+str(year)+"0701.ppdc-ases.txt")
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

def getIXPs(AfricanAses):
    #MUST DO
    print("Fetching IXPs")
    dictAs = copy.deepcopy(AfricanAses)
    AfricanIXPs= getIXPs.prepareIXPs(dictAs)
    print("IXPs prepared with direct ASN customers")
    return AfricanIXPs

def makeRelationshipsForYear(year, AfricanAses):
    #MUST DO
    print("Creating relationships")
    AfricanAses = Relationships.makeRelationships(AfricanAses,"./backend/files/"+str(year)+"/"+str(year)+"0701.as-rel.txt")
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

def writeASNS(year,AfricanAses):
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
    ASDict,AfricaTotals= getAfricaLocationsAfterExtraction(yeartoprocess,ASDict)
    IXPDict =getIXPs(ASDict)
    ASDict=makeRelationshipsForYear(yeartoprocess,ASDict)
    writeASNS(yeartoprocess,ASDict)
    writeIXPS(yeartoprocess,IXPDict)


if __name__=="__main__":
    for year in range(1998,2021):
        prepData(year)