import requests
import time
import aiohttp
import asyncio
import math

Africa=["DZ","AO","SH","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","DJ","EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","CI","KE","LS","LR","LY","MG","MW","ML","MR","MU","YT","MA","MZ","NA","NE","NG","ST","RE","RW","ST","SN","SC","SL","SO","ZA","SS","SH","SD","SZ","TZ","TG","TN","UG","CD","ZM","TZ","ZW"]

def inAfrica(code):
    return (code.upper() in Africa)
'''
ASYNC FUNCTIONS:
getASNOrg(AS,session) takes in session object (used for making http requests) and an ASN id and performs a whois request and returns it as well as the AS used to make the request using python's async/await mechanism for asynchronous programming

run(r)
Given a list(analogous to an array in Java etc) of ASN IDs, run compiles a list of requests being awaited, each wrapped in a "future" object (created by asyncio), and these "futures" are "gathered" and returned upon all requests being completed.
'''
async def getASNOrg(AS, session):
    async with session.get("https://stat.ripe.net/data/whois/data.json?resource="+AS) as response2:
        return [await response2.json(),AS]

async def run(r):
    tasks = []

    async with aiohttp.ClientSession() as session:
        for i in r:
            task = asyncio.ensure_future(getASNOrg(i, session))
            tasks.append(task)

        responses = await asyncio.gather(*tasks)
    return responses

'''
getAllASNs(filename) takes in the file name of the ppdc file and reads the AS ids in it, and stores the size of the cone of the Autonomous System. Thereafter, in batches of 1000, it performs the whois requests using the asynchoronous mechanisms implemented by asyncio and aiohttp to perform http requests. For each batch, it extracts the Organisation for each AS and stores it in the dictionary of ASes. Once all batches are complete, it returns this dictionary. Following this method, the current state of the AS dictionary is {'ASN_ID':{'organisation': <organisation>, 'cone':<size of cone>}} and is sorted by cone size (as this is how the ppdc file is arranged)
'''

def getAllASNs(filename):
    
    ASes = open(filename, "r")
    ASlines = ASes.readlines()
    
    ASOrgs={}
    for line in ASlines:
        if (not("#" in line)):
            temp=line.split(" ")
            cone=(len(temp)-1)
            ASOrgs[temp[0]]={"cone":cone}
    AllASes =list(ASOrgs.keys())
    max = math.ceil(len(AllASes)/1000)
    start = time.time()
    for i in range(0,max):
        if i!=max-1:
            ASNSubset= AllASes[(1000*(i)):(1000*(i+1))]
        else:
            ASNSubset= AllASes[((max-1)*1000):]
        print("Percentage complete: ",100*i/max)
        # loop = asyncio.get_event_loop()
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        future = asyncio.ensure_future(run(ASNSubset))
        loop.run_until_complete(future)
        results = future.result()
        # print("got results #"+str(i+1))
        for result in results:
            organisationwhois=result[0]
            ASNum = result[1]
            try:
                organisation ="IGNOREDONOTUSE"
                for dataobj in organisationwhois["data"]["records"][0]:
                    if dataobj["key"]=="org":
                        organisation=dataobj["value"]
                        # print(organisation)
                        break
                    
                ASOrgs[ASNum]["organisation"]=organisation
            except:
                ASOrgs[ASNum]["organisation"]=organisation
                continue
    return ASOrgs