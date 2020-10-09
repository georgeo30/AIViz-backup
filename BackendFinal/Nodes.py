import requests
import json
import csv
import copy
class Node:
    def __init__(self, id, latitude, longitude, country):
        #private attributes of the Node class (indicated by double underscore prefix)
        self.__id = str(id)
        self.__latitude = str(latitude)
        self.__longitude = str(longitude)
        self.__country = str(country)

    @property
    def id(self):
        return self.__id
    @id.setter
    def id(self,id):
        self.__id=id
    
    @property
    def latitude(self):
        return self.__latitude
    @latitude.setter
    def latitude(self,latitude):
        self.__latitude=latitude

    @property
    def longitude(self):
        return self.__longitude
    @longitude.setter
    def longitude(self,longitude):
        self.__longitude=longitude

    @property
    def country(self):
        return self.__country
    @country.setter
    def country(self,country):
        self.__country=country


#ASN inheritance from class Node, has MAP of relationships with ASNs
class ASN(Node):
    def __init__(self, id, latitude, longitude, country,relationships,CountryLevel,AfricaLevel):
        super().__init__(("ASN_"+str(id)), latitude, longitude, country)
        self.__relationships = copy.deepcopy(relationships)
        self.__CountryLevel=str(CountryLevel)
        self.__AfricaLevel=str(AfricaLevel)
    
    @property
    def AfricaLevel(self):
        return self.__AfricaLevel
    
    @property
    def CountryLevel(self):
        return self.__CountryLevel
    

    @property
    def relationships(self):
        return " ".join(self.__relationships)

    def addRelationships(self, relationshipList):
        self.__relationships= copy.deepcopy(relationshipList)

    def __str__(self):
        return ("{\"id\":\""+self.id+"\",\"latitude\":"+self.latitude+",\"longitude\":"+self.longitude+",\"country\":\""+self.country+"\",\"map\":\""+self.relationships.strip(" ")+"\",\"CountryLevel\":"+self.CountryLevel+",\"AfricaLevel\":"+self.AfricaLevel+"}")
    

#IXP inheritance from class Node, has LIST of ASN first customers
class IXP(Node):
    def __init__(self, id, name, country, latitude, longitude,customers):
        super().__init__(("IXP_"+str(id)), latitude, longitude, country)
        self.__customers = customers
        self.__name =name
    
    @property
    def name(self):
        return self.__name
    @name.setter
    def name(self,name):
        self.__name=name
    
    @property
    def customers(self):
        return self.__customers

        
    def __str__(self):
        return ("{\"id\":\""+self.id+"\",\"name\":\""+self.name+"\",\"Country\":\""+self.country+"\",\"latitude\":"+self.latitude+",\"longitude\":"+self.longitude+",\"customers\":"+str("\""+",".join(self.customers)+"\"}"))
    
def filterASNContinent(path):

    print("done")
