from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)




@app.route('/')
def index():
  return 'Server Works!'
  
@app.route('/greet')
def say_hello():
  return 'Hello from Server'

#IXP
@app.route('/ixp/<file>')
def show_ixp(file):
  f=open("./backend/IXPS/"+file,"r")
  jIXPFile=f.read()
  f.close()
  #returns the username
  return jIXPFile

#ASN
@app.route('/asn/<file>')
def show_asn(file):
  f=open("./backend/ASNS/"+file,"r")
  jASNFile=f.read()
  f.close()
  #returns the username
  return jASNFile

#list of file dates
@app.route('/dates')
def show_dates():
  k=open("./backend/datelist.json")
  dates=k.read()
  k.close()
  return dates

app.run()