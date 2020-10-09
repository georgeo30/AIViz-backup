# import multiprocessing as mp
# import requests
# import time
import aiohttp
import asyncio
# import math

def makeRelationships(ASNDictionary,relationshipFile):
    # f = open("./backend/asns.txt","r")
    # ASNLines = f.readlines()
    # for ASN in ASNLines:
    #     relationships[ASN.strip("\n")]=[]
    # f.close()
    for asn in ASNDictionary.keys():
        ASNDictionary[asn]["relationships"]=[]
    f = open(relationshipFile,"r")
    relationshipLines = f.readlines()
    for line in relationshipLines:
        if "#" in line:
            continue
        details=line.split("|")
        if details[0] in ASNDictionary:
            if details[1] in ASNDictionary:
                as1=details[0]
                as2=details[1]
                as1org=ASNDictionary[as1]["organisation"]
                as2org=ASNDictionary[as2]["organisation"]
                sameorg= ((as1org==as2org) and (as1org!="IGNOREDONOTUSE") and (as1org!="IGNOREDONOTUSE"))
                as1Locations=ASNDictionary[as1]["locations"].keys()
                as2Locations=ASNDictionary[as2]["locations"].keys()

                for location2 in as2Locations:
                    ASNDictionary[as1]["relationships"].append(str("ASN_"+as2+"_"+location2+":s2s") if sameorg==True else str("ASN_"+as2+"_"+location2+":p2p") if str(details[2])=="0" else str("ASN_"+as2+"_"+location2+":c2p"))
                for location1 in as1Locations:
                    ASNDictionary[as2]["relationships"].append(str("ASN_"+as1+"_"+location1+":s2s") if sameorg==True else str("ASN_"+as1+"_"+location1+":p2p") if str(details[2])=="0" else str("ASN_"+as1+"_"+location1+":c2p"))
    f.close()
    return ASNDictionary
    # f=open("./backend/relationships.txt","w")
    # for key in relationships.keys():
    #     f.write("ASN: "+key+"\tRelationships"+str(relationships[key])+"\n")
    #     f.flush()
    # f.close()