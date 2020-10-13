import aiohttp
import asyncio

def makeRelationships(ASNDictionary,relationshipFile):
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
                    if (sameorg):
                        ASNDictionary[as1]["relationships"].append(str("ASN_"+as2+"_"+location2+":s2s"))
                    elif (str(details[2]).strip("\n")=="0"):
                        ASNDictionary[as1]["relationships"].append(str("ASN_"+as2+"_"+location2+":p2p"))
                    else:
                        ASNDictionary[as1]["relationships"].append(str("ASN_"+as2+"_"+location2+":c2p"))
                   # ASNDictionary[as1]["relationships"].append(str("ASN_"+as2+"_"+location2+":s2s") if sameorg==True else str("ASN_"+as2+"_"+location2+":p2p") if str(details[2])=="0" else str("ASN_"+as2+"_"+location2+":c2p"))
                for location1 in as1Locations:
                    if (sameorg):
                        ASNDictionary[as2]["relationships"].append(str("ASN_"+as1+"_"+location1+":s2s"))
                    elif (str(details[2]).strip("\n")=="0"):
                        print("suckyomom")
                        ASNDictionary[as2]["relationships"].append(str("ASN_"+as1+"_"+location1+":p2p"))
                    else:
                        ASNDictionary[as2]["relationships"].append(str("ASN_"+as1+"_"+location1+":c2p"))
                    #ASNDictionary[as2]["relationships"].append(str("ASN_"+as1+"_"+location1+":s2s") if sameorg==True else str("ASN_"+as1+"_"+location1+":p2p") if str(details[2])=="0" else str("ASN_"+as1+"_"+location1+":c2p"))
    f.close()
    return ASNDictionary