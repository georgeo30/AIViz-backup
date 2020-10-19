//Screen dimensions
const width = window.innerWidth,height = window.innerHeight;

//Zoom settings
const OVERLAY_MULTIPLIER = 10;
const OVERLAY_OFFSET = OVERLAY_MULTIPLIER / 2 - 0.5;
const ZOOM_DURATION = 500;
const ZOOM_IN_STEP = 2;
const ZOOM_OUT_STEP = 1 / ZOOM_IN_STEP;
const ZOOM_COUNTRY_CLICK = 4;
const ZOOM_THRESHOLD = [1, 13];
var k = 1;

//Zoom object
const zoom = d3.zoom().scaleExtent(ZOOM_THRESHOLD).on("zoom", zoomed);

//Canvas settings (Centers projection)
var x = width / 2, y = height / 2;
var centered;


//Projection type
var projection = d3
  .geoMercator()
  .translate([width / 2.5, height / 2.25])
  .scale(600);

//Path generator
var path = d3.geoPath().projection(projection);

//ASN projection
var pathTwo = d3.geoPath().projection(projection).pointRadius(5);

//Create canvas using previously defined settings in an svg element
var svg = d3
  .select("#main")
  .append("svg")
  .attr("id", "svg-element")
  .attr("width", width)
  .attr("height", height)

;
//Tag canvas with the zoom object
var g = svg.call(zoom).append("g");
//Add empty rectangle within the canvas for smoother zoom experience (d3 conventions)
g.append("rect")
  .attr("width", width * OVERLAY_MULTIPLIER)
  .attr("height", height * OVERLAY_MULTIPLIER)
  .attr(
    "transform",
    `translate(-${width * OVERLAY_OFFSET},-${height * OVERLAY_OFFSET})`
  )
  .style("fill", "none")
  .style("pointer-events", "all")
  .on("mouseover", hoverleave)
  ;

d3.select("#zoom-in").on("click", function () {
  clickToZoom(ZOOM_IN_STEP);
});
d3.select("#zoom-out").on("click", function () {
  clickToZoom(ZOOM_OUT_STEP);
});
d3.select("#centre").on("click", function () {
  resetZoom();
});

//Globally accesible variables

//Determines behaviour of onClick methods based on the currentview (Starts out as continental by default)
var currentView = "continental";

//Stored to reset a previously clicked Country's visual settings when the user changes the view
var previousCountry;

//Stored to reset a previously clicked IXP's settings when the user changes views
var previousIXP;

//Direct customers of the currently clicked IXP
var customerAsns;

//Country list of asns that must be displayed (user for efficiency purposes)
//Search only through countries which contain asns that must be displayed for an ixp view instead of all countries in the world
var countryAsns = [];

//IXP id is mapped to it's corresponding data
var ixpsbyid;

//IXP id is mapped to the level it corresponds to (1st level asn: Direct customer of an IXP, 2nd level asn:  asn that has a relationship with a  1st level asn but not with the IXP directly ... )
var asnViewMap;

//Ixp levels are mapped to an array of asns that fall within each category (1st level asns would be accessed using "levelsMap[1]" and so forth)
var levelsMap;

//ASN id is mapped to it's corresponding data
var asnsbyid;

//Currently clicked quartile (example: 1st quartile contains 25% of asns with the most number of relationsips )
var level = 1;

//Previous ixp level is used to evaluate whether to process new data or do visibility changes to existing elements only (Efficiency purposes)
var previousLevel;

//Relationship checkboxes use to evaluate what relationships must be drawn on screen at all times
var p2pCheckBox = document.getElementById("p2pcb");

var c2pCheckBox = document.getElementById("c2pcb");

var s2sCheckBox = document.getElementById("s2scb");

//Colour scheme used to categorize asns based on the quartile they fall under
//First quartile asns will be marked as pink, Second quartile asns will be marked as lighter pink and so forth
var colorScheme = { 1: "#ff47f3", 2: "#ff7cb2", 3: "#ffb26f", 4: "#ffe72e" };


//Loading-screen element that will be displayed when the user wants to load in Asn & Ixp files from a different year
var loaderDiv = document.createElement("div");
loaderDiv.className = "loader-wrapper";
loaderSpan = document.createElement("span");

loaderSpan.className = "loader";
loaderInnerSpan = document.createElement("span");

loaderInnerSpan.className = "loader-inner";
loaderSpan.appendChild(loaderInnerSpan);
loaderDiv.appendChild(loaderSpan);

//dateList contains the years for which the backend has available Asn & Ixp files
//The years for which there are available resource will be displayed in a dropdown menu from which the user can select a year of choice
var dateList;
var clickedDate;

//Loads the map with the most recent asn and ixp files along with a list of years for which there is available data for the user to select
loadLatestList();
/**
 * Loads the map with the most recent asn and ixp files along with a list of years for which there is available data for the user to select
 */
function loadLatestList()
{
  d3.queue().defer(d3.json, "http://127.0.0.1:5000/dates").await(readyList);
  function readyList(error, dates) {
    dateList = dates;
    latest = dateList["dates"][0];
    d3.queue()
      .defer(d3.json, "../data/africaTopo.json")

      .defer(d3.json, "http://127.0.0.1:5000/ixp/" + latest + ".json")


      .defer(d3.json, "http://127.0.0.1:5000/asn/" + latest + ".json")

      .await(ready);
  }
}
/**
 * Api call to retrieve asn & ixp data for user's selected year using the html dropdown element
 * @param  {Event} dateChangeEvent - onClick event that contains the new user selected year
 */
function loadDifferentData(dateChangeEvent) {
  //Reset variables
  InitialState();
  //Retrieve the date from the event
  let year = dateChangeEvent.target.value;
  //Display loading screen
  document.getElementById("main").appendChild(loaderDiv);
  //Api calls

  d3.queue()
    .defer(
      d3.json,
      "http://127.0.0.1:5000/ixp/" + year + ".json"
    )
    .defer(
      d3.json,
      "http://127.0.0.1:5000/asn/" + year + ".json"
    )
    .await(readyChangeDate);
}
/**
 * Resets the global variables, states of html elements and zoom level
 */
function InitialState() {
  //Resetting variables

  currentView = "continental";
  borderCheck(true);
  previousCountry = null;
  previousIXP = null;
  customerAsns = null;
  countryAsns = [];
  ixpsbyid = null;
  asnsbyid = null;
  level = 1;
  asnViewMap = null;
  levelsMap = null;
  previousLevel = null;
  //Resetting html elements
  document.getElementById("c2pcb").checked = true;
  document.getElementById("s2scb").checked = true;
  document.getElementById("p2pcb").checked = true;
  document.getElementById("radio-1").checked = true;
  document.getElementById("radiobuttons").style.display = "initial";
  document.getElementById("allixpsandasns").checked = true;
  document.getElementById("cbborder").checked = true;
  //Resetting zoom level
  resetZoom();
}


/**
 * Draws the continent & asns and ixps once all files have been succesfully loaded
 * @param  {Error} error - Error object returned if api call fails
 * @param  {Object} africa - GeoJson features of the continent
 * @param  {Array} ixps - List of ixp elements
 * @param  {Array} asns  - List of asn elements
 */
function ready(error, africa, ixps, asns) {
  //Adds and parses attributes for each ixp element
  ixps = typeIxp(ixps);
  //Adds and parses attributes for each asn element
  asns = typeAsn(asns);
  //Error handler
  if (error) throw error;

  //Creates a map of ixps accessed by id
  ixpsbyid = d3.map(ixps, function (d) {
    return d.id;
  });
  //Creates a map of asns accessed by id
  asnsbyid = d3.map(asns, function (d) {
    return d.id;
  });

  //Convert each country from the topology file to a geoJson feature
  var features = topojson.feature(africa, africa.objects.edit).features;

  //Draw countries inside the drawing box using the geoJson features
  drawCountryBorders(features);

  //Add empty country-containers that will contain asn and ixp elements
  addCountryElements(features);

  //Draw all IXPS
  drawIXPS(ixps);

  //Draw all ASNS
  drawASNS(asns);

  //Remove loading screen when everything has loaded
  d3.select(".loader-wrapper").remove();

  //Generates the UI dropdown for files of different years to be loaded upon a users request
  datesDropdown();
}
/**
 * Add g elements to the dom which represent each country in the features array to which asns and ixps will be added
 * @param  {Array} features - List of GeoJson features
 */
function addCountryElements(features){
  var countries = g
  .selectAll(null) //null is used since no country containers have been defined before (no search time -> more efficient )
  .data(features)
  .enter()
  .append("g")
  .attr("class", "country")
  .style("visibility", "visible")
  .attr("id", function (currentFeature) {
    return currentFeature.properties.country_code;
  });
}

/**
 * Draws the ixps and asns on the map and differentiates from the "ready" function since the continent is not redrawn in this case
 * @param  {Object} error
 * @param  {Array} ixps - List of ixps
 * @param  {Array} asns - List of asns
 */
function readyChangeDate(error, ixps, asns) {
  d3.selectAll(".country").each(function(){
    d3.select(this).style("visibility","visible");
    d3.select(this).selectAll("*").remove();
  });
  //Add and parse attributes for the list of ixps and asns
  ixps = typeIxp(ixps);
  asns = typeAsn(asns);
  if (error) throw error;

  //Set id fields as the key for the ixp and asn datasets
  ixpsbyid = d3.map(ixps, function (d) {
    return d.id;
  });
  asnsbyid = d3.map(asns, function (d) {
    return d.id;
  });

  //Draw all IXPS
  drawIXPS(ixps);

  //Draw all ASNS
  drawASNS(asns);

  //Reset the view to continental
  currentView = "continental";

  //Reset the dom element states
  document.getElementById("allixpsandasns").checked;
  document.getElementById("ixplevelcontrol").style.display = "none";
  d3.select(".loader-wrapper").remove();

}
/**
 * Draws the country borders and fill within the canvas using geojson input
 * @param  {Array} features - GeoJson features for all african countries
 */
function drawCountryBorders(features) {
  //Add drawing-box element that will contain all country drawings (outlines of a country & an onclick method)
  let drawingBox = g.append("g").attr("class", "drawing-box");
  drawingBox
    .selectAll(null) //null is used since no country-area element has been created before
    .data(features)
    .enter()
    .append("path")
    .attr("class", "country-area")
    .attr("d", path)
    .on("click", clickCountry)
    .on("mouseover", hoverCountry);
}
/**
 * Draws and appends ixps (as triangles) to its corresponding country element
 * @param  {Array} ixps - List of ixps to be drawn on screen
 */
function drawIXPS(ixps) {
  g.selectAll(null)
    .data(ixps)
    .enter()
    .each(function (currentIxp, i) {
      let currentCountry = g.select(`#${currentIxp.country}.country`);
      currentCountry
        .append("polygon")
        .datum(currentIxp)
        .attr("points", function () {
          let len = 8;
          let cons = Math.sqrt(3) / 2;
          let centerX = projection([
            currentIxp.longitude,
            currentIxp.latitude,
          ])[0];
          let centerY = projection([
            currentIxp.longitude,
            currentIxp.latitude,
          ])[1];
          return `${
            centerX - len * cons
          },${centerY + len / 2} ${centerX},${centerY - len} ${centerX + len * cons},${centerY + len / 2}`;
        })
        .attr("class", "IXP")
        .style("visibility", "inherit")
        .attr("id", function () {
          return `IXP_${currentIxp.id}`;
        })
        .on("click", clickIxp)
        .on("mouseover", hoverIXP);
    });
}
/**
 * Draws and appends asns (as circles) to it's corresponding country element
 * @param  {Object} asns - List of ixps to be drawn on screen
 */
function drawASNS(asns) {
  g.selectAll(null)
    .data(asns)
    .enter()
    .each(function (sourceAsn) {
      let currentCountry = g.select(`#${sourceAsn.country}.country`);
      currentCountry
        .append("g")
        .datum(sourceAsn)
        .attr("class", "ASN")
        .style("visibility", function (d) {
          return d.AfricaLevel <= level ? "inherit" : "hidden";
        })
        .attr("id", function (d) {
          return sourceAsn.id;
        })
        .each(function (d, i) {
          let currentContainer = d3.select(this); //g element

          let countryC2pStatus = c2pStatus() ? "inherit" : "hidden";
          let countryP2pStatus = p2pStatus() ? "inherit" : "hidden";
          let countryS2sStatus = s2sStatus() ? "inherit" : "hidden";

          let p2pGroup = currentContainer
            .append("g")
            .attr("class", "p2p")
            .style("visibility", countryP2pStatus);

          let c2pGroup = currentContainer
            .append("g")
            .attr("class", "c2p")
            .style("visibility", countryC2pStatus);

          let s2sGroup = currentContainer
            .append("g")
            .attr("class", "s2s")
            .style("visibility", countryS2sStatus);

          sourceAsn.map.forEach(function (
            relationshipType,
            destinationKey
          ) {


            let destinationAsn = asnsbyid.get(destinationKey);

            currentContainer
              .select(`g.${relationshipType}`)
              .append("line")
              .attr("x1", function () {
                return projection([sourceAsn.longitude, sourceAsn.latitude])[0];
              })
              .attr("x2", function () {
                return projection([
                  destinationAsn.longitude,
                  destinationAsn.latitude,
                ])[0];
              })
              .attr("y1", function () {
                return projection([sourceAsn.longitude, sourceAsn.latitude])[1];
              })
              .attr("y2", function () {
                return projection([
                  destinationAsn.longitude,
                  destinationAsn.latitude,
                ])[1];
              })
              .style("visibility", function () {
                if (destinationAsn.AfricaLevel > sourceAsn.AfricaLevel) {
                  return "hidden";
                }
                else if (destinationAsn.AfricaLevel == sourceAsn.AfricaLevel) {
                  return destinationAsn.processed ? "hidden" : "inherit";
                }
                else {
                  return "inherit";
                }
              })

              .attr("class", relationshipType)
              .attr("destination", destinationAsn.id);
          });

          currentContainer
            .append("circle")
            .attr("class", function (d) {
              return `asn-dot`;
            })
            .attr("cx", function (d) {
              return projection([sourceAsn.longitude, sourceAsn.latitude])[0];
            })
            .attr("cy", function (d) {
              return projection([sourceAsn.longitude, sourceAsn.latitude])[1];
            })

            .style("visibility", "inherit")
            .style("fill", continentalFill)
            .style("stroke", continentalFill)
            .style("fill-opacity", 0.25)

            .attr("r", 1.5)
            .on("mouseover", hoverASN);
        });

      sourceAsn.processed = true;
    });
}
/**
 * Retrieves the color code that must be applied to a given asn based on it's continental quartile (africaLevel) property
 * @param  {Object} d - Asn element
 * @returns {string} Color code for the asn
 */
function continentalFill(d) {
  return colorScheme[d.AfricaLevel];
}
/**
 * Retrieves the color code that must be applied to a given asn based on it's national quartile (CountryLevel) property
 * @param  {Object} d - Asn element
 * @returns {string} Color code for the asn
 */
function countryFill(d) {
  return colorScheme[d.CountryLevel];
}
/**
 * Event listener that gets triggered when the border checkbox value is changed
 * @param  {Event} borderView - current value of the border checkbox in the UI
 */
function borderChange(borderView) {
  let viewStatus = borderView.target.checked;
  //Delegates the drawing/removing of borders
  borderCheck(viewStatus);

}
/**
 * Draws or removes the borders of all countries on the map based on the input flag value
 * @param  {Boolean} showFlag - Flag that indicates when to draw (showFlag = true) borders and when to remove them (showFlag = false)
 */
function borderCheck(showFlag) {
  let cols = document.getElementsByClassName("country-area");
  if (showFlag) {
    for (i = 0; i < cols.length; i++) {
      cols[i].style.stroke = "black";
    }
  }
  else {
    let cols = document.getElementsByClassName("country-area");
    for (i = 0; i < cols.length; i++) {
      cols[i].style.stroke = "rgb(204,204,204,0.9)";
    }
  }
}

/**
 * Resets the previous's views components and delegates/triggers the drawing component of the continental view
 */
function continentalView() {

  document.getElementById("ixplevelcontrol").style.display = "none";
  document.getElementById("radiobuttons").style.display = "initial";

  resetLevelComponent();

  resetZoom();

  resetPreviousView();

  resetProcessed();

  currentView = "continental";

  let viewStatus = document.getElementById("allixpsandasns").checked;

  drawEverything(viewStatus);
}


/**
 * Retrieves the peer to peer checkbox status and delegates/triggers the enabling/disabling of the relationships
 */
function peerToPeer() {
  let visibilityStatus = p2pStatus();
  setType("p2p", visibilityStatus);
}

/**
 * Retrieves the customer to provider checkbox status and delegates/triggers the enabling/disabling of the relationships
 */
function customerToProvider() {
  let visibilityStatus = c2pStatus();
  setType("c2p", visibilityStatus);
}
/**
 * Retrieves the sibling to sibling checkbox status and delegates/triggers the enabling/disabling of the relationships
 */
function siblingToSibling() {
  let visibilityStatus = s2sStatus();
  setType("s2s", visibilityStatus);
}
/**
 * Gets the current status of the customer to provider checkbox (checked=true  or unchecked=false)
 * @return {Boolean} checkbox status
 */
function c2pStatus() {
  return c2pCheckBox.checked;
}
/**
 * Gets the current status of the peer to peer checkbox (checked=true  or unchecked=false)
 * @return {Boolean} checkbox status
 */
function p2pStatus() {
  return p2pCheckBox.checked;
}
/**
 * Gets the current status of the sibling to sibling checkbox (checked=true  or unchecked=false)
 * @return {Boolean} checkbox status
 */
function s2sStatus() {
  return s2sCheckBox.checked;
}

/**
 * Enables or disables all the relationships of a passed in type based on the state of the customer to provider UI checkbox for the current view
 * @param  {String} relationshipType - sibling to sibling, peer to peer, customer to provider
 * @param  {Boolean} visible - visible = true shows all the relationships
 */
function setType(relationshipType, visible) {
  visibilityStatus = visible ? "inherit" : "hidden";

  if (currentView.toLowerCase() == "continental") {
    g.selectAll(".ASN")
      .selectAll(`g.${relationshipType}`)
      .each(function (d) {
        d3.select(this).style("visibility", visibilityStatus);
      });

  } else if (currentView.toLowerCase() == "national") {

    g.select(`#${previousCountry}.country`)
      .selectAll(".ASN")
      .selectAll(`g.${relationshipType}`)
      .each(function (d) {
        d3.select(this).style("visibility", visibilityStatus);
      });
  } else {
    let ixpC2pStatus = c2pStatus() ? "inherit" : "hidden";
    let ixpP2pStatus = p2pStatus() ? "inherit" : "hidden";
    let ixpS2sStatus = s2sStatus() ? "inherit" : "hidden";

    countryAsns.forEach(function (country) {
      g.select(`#${country}.country`)
        .selectAll(".ASN")
        .each(function (d, i) {
          let asnLevel = asnViewMap.get(d.id.toString());
          if (asnLevel <= level) {
            d3.select(this).select("g.c2p").style("visibility", ixpC2pStatus);
            d3.select(this).select("g.p2p").style("visibility", ixpP2pStatus);
            d3.select(this).select("g.s2s").style("visibility", ixpS2sStatus);
          }
        });
    });
  }
}
/**
 * Resets the previous's views components
 */
function resetPreviousView() {
  if (currentView === "national") {
    revertToCountryInherit();
  } else if (currentView === "IXP") {
    revertToIXPInherit();
  }
}

/**
 * Resets the previous's views data and instantiates the needed data structure to generate an ixp view
 * The process of generating the actual ixp is delegated and triggered by calling "showIxp()"
 * @param  {Object} d - Ixp element
 */
function clickIxp(d) {
  document.getElementById("radiobuttons").style.display = "none";
  document.getElementById("ixplevelcontrol").style.display = "initial";
  document.getElementById("allixpsandasns").checked = false;

  if (currentView == "national") {
    revertToCountryInherit();
    resetLevelComponent();
    previousIXP = d;
    let clickedIxp = d;

    asnViewMap = new Map();
    levelsMap = new Map();

    currentView = "IXP";
    showIxp(clickedIxp);
  }
  else if (currentView == "continental") {
    let clickedIxp = d;
    previousIXP = d;

    resetProcessed();
    resetLevelComponent();

    asnViewMap = new Map();
    levelsMap = new Map();

    currentView = "IXP";
    showIxp(clickedIxp);
  }
}
/**
 * Draws the ixp along with it's first customers and their relatinonships on screen
 * @param  {Object} d - Ixp element
 */
function levelOne(d) {
  levelsMap.set("1", customerAsns);
  levelsMap.set("2", []);

  countryAsns = [];
  customerAsns.forEach(function (id) {
    countryAsns.push(asnsbyid.get(id).country);
    asnViewMap.set(id, "1");
  });

  countryAsns = [...new Set(countryAsns)];

  let ixpC2pStatus = c2pStatus() ? "inherit" : "hidden";
  let ixpP2pStatus = p2pStatus() ? "inherit" : "hidden";
  let ixpS2sStatus = s2sStatus() ? "inherit" : "hidden";

  countryAsns.forEach(function (country) {
    g.select(`#${country}.country`)
      .selectAll(".ASN")
      .each(function (d, i) {
        if (customerAsns.includes(d.id)) {
          d3.select(this).style("visibility", "visible");

          d3.select(this).select("g.c2p").style("visibility", ixpC2pStatus);
          d3.select(this).select("g.p2p").style("visibility", ixpP2pStatus);
          d3.select(this).select("g.s2s").style("visibility", ixpS2sStatus);

          d3.select(this)
            .selectAll("g")
            .each(function (d) {
              currentGroup = d3.select(this);
              currentGroup.selectAll("line").each(function (d) {
                let pathDestination = d3.select(this).attr("destination");
                if (asnViewMap.get(pathDestination) == "1") {
                  //If the destination asn has been processed ignore the current path
                  if (asnsbyid.get(pathDestination).processed) {
                    d3.select(this).style("visibility", "hidden");
                  }
                  //otherwise the path stays as inherit (drawn)

                  //customer asns of level 1 remain as inherit
                } else if (asnViewMap.get(pathDestination) == "2") {
                  d3.select(this).style("visibility", "hidden");
                } else {
                  asnViewMap.set(pathDestination, "2");
                  levelsMap.get("2").push(pathDestination);
                  d3.select(this).style("visibility", "hidden");
                }
                // if (!customerAsns.includes(pathDestination)) {
                //   d3.select(this).style("visibility", "hidden");
                // }
              });
            });
          //Processed asn to avoid duplicates
          d.processed = true;
        }
      });
  });



  if (!levelsMap.get("1").length) {
    document.getElementById("increase").disabled = true;
    document.getElementById("increase").style.backgroundColor = "grey";
  }
}

/**
 * Draws an ixp's nth level customers on the map along with their respective relationships
 * @param  {Number} index - Current level
 */
function levelsN(index) {
  let nextIndex = index + 1;
  //sets the map for the next layer
  if (levelsMap.get(nextIndex.toString()) == null) {
    levelsMap.set(nextIndex.toString(), []);
  }

  //Finding the country for each customer in the customerAsns list
  levelsMap.get(index.toString()).forEach(function (id) {
    countryAsns.push(asnsbyid.get(id).country);
  });

  //Removing duplicates
  countryAsns = [...new Set(countryAsns)];

  let ixpC2pStatus = c2pStatus() ? "inherit" : "hidden";
  let ixpP2pStatus = p2pStatus() ? "inherit" : "hidden";
  let ixpS2sStatus = s2sStatus() ? "inherit" : "hidden";

  countryAsns.forEach(function (country) {
    g.select(`#${country}.country`)
      .selectAll(".ASN")
      .each(function (d, i) {
        if (asnViewMap.get(d.id) == index.toString()) {

          d3.select(this).style("visibility", "visible");

          d3.select(this).select("g.c2p").style("visibility", ixpC2pStatus);
          d3.select(this).select("g.p2p").style("visibility", ixpP2pStatus);
          d3.select(this).select("g.s2s").style("visibility", ixpS2sStatus);

          d3.select(this)
            .selectAll("g")
            .each(function (d) {
              currentGroup = d3.select(this);
              currentGroup.selectAll("line").each(function (d) {
                let pathDestination = d3.select(this).attr("destination");
                if (asnViewMap.get(pathDestination) == index.toString()) {
                  //customer asns of level 1 remain as inherit
                  if (asnsbyid.get(pathDestination).processed) {
                    d3.select(this).style("visibility", "hidden");
                  }
                  //Otherwise path is drawn
                }
                //Have come across this element in layer below before
                else if (
                  asnViewMap.get(pathDestination) == nextIndex.toString()
                ) {
                  d3.select(this).style("visibility", "hidden");
                } else if (asnViewMap.get(pathDestination) < index.toString()) {
                  //Do nothing (draw the path by default)
                }

                //Destination in next layer but no yet registered in the map
                else {
                  asnViewMap.set(pathDestination, nextIndex.toString());
                  levelsMap.get(nextIndex.toString()).push(pathDestination);
                  d3.select(this).style("visibility", "hidden");
                }
              });
            });

          d.processed = true;
        }
      });
  });

  if (!levelsMap.get(nextIndex.toString()).length) {
    document.getElementById("increase").disabled = true;
    document.getElementById("increase").style.backgroundColor = "grey";
  }
}
/**
 * Disables all the country elements and selectively enables the ixp and its respective asn customers
 * The asns are drawn iteratively by delegating this process to the levelOne and levesN functions
 * @param  {Object} d - Ixp element
 */
function showIxp(d) {
  //Sets everything on the map to hidden
  g.selectAll(".country").style("visibility", "hidden");
  g.select(`#${d.country}.country`)
    .selectAll(`#IXP_${d.id}`)
    .each(function (d) {
      d3.select(this).style("visibility", "visible");
      customerAsns = d.customers;
    });
  if (d.customers.length) {
    //LEVEL 1:
    levelOne(d);

    //LEVEL >=1
    //
    for (let i = 2; i <= level; i++) {
      levelsN(i);
    }
  } else {
    document.getElementById("increase").disabled = true;
    document.getElementById("increase").style.backgroundColor = "grey";
  }
}

/**
 * Displays the cumulative amount of asns and ixps for a hovered country
 * @param  {Object} d - Country element
 */
function hoverCountry(d) {
  let cCode =
    " Country Name : " + d.properties.name + ", " + d.properties.country_code;
  let noOfIXPs =
    " Number of IXPs : " +
    g
      .select(`.country#${d.properties.country_code}`)
      .selectAll(`polygon`)
      .size();
  let noOfASNs =
    " Number of ASNs : " +
    g.select(`.country#${d.properties.country_code}`).selectAll(`g.ASN`).size();
  document.getElementById("cCodeHTML").textContent = cCode;
  document.getElementById("noOfIXPsHTML").textContent = noOfIXPs;
  document.getElementById("noOfASNsHTML").textContent = noOfASNs;

  document.getElementById("ixpIdHTML").textContent = "";
  document.getElementById("ixpNameHTML").textContent = "";
  document.getElementById("ixpCountryHTML").textContent = "";
  document.getElementById("ixpCustomersHTML").textContent = "";

  document.getElementById("asnIdHTML").textContent = "";
  document.getElementById("asnCountryHTML").textContent = "";
  document.getElementById("asnCustomersHTML").textContent = "";
}

/**
 * Notes reverts back to original
 */
function hoverleave(){

  let cCode ="Hover over an ASN, IXP or country to see details";
  document.getElementById("cCodeHTML").textContent = cCode;

  document.getElementById("noOfIXPsHTML").textContent = "";
  document.getElementById("noOfASNsHTML").textContent = "";
  document.getElementById("ixpIdHTML").textContent = "";
  document.getElementById("ixpNameHTML").textContent = "";
  document.getElementById("ixpCountryHTML").textContent = "";
  document.getElementById("ixpCustomersHTML").textContent = "";

  document.getElementById("asnIdHTML").textContent = "";
  document.getElementById("asnCountryHTML").textContent = "";
  document.getElementById("asnCustomersHTML").textContent = "";
}

/**
 * Displays information about a hovered ixp such as it's name, id and direct customers
 * @param  {Object} d - Country element
 */
function hoverIXP(d, i) {
  let ixpIdHTML = " IXP ID : " + d.id;
  let ixpNameHTML = " IXP Name :  " + d.name;
  let ixpCountryHTML = " Country : " + d.country;
  let ixpCustomersHTML = " Direct Customers : " + d.customers.length;
  document.getElementById("ixpIdHTML").textContent = ixpIdHTML;
  document.getElementById("ixpNameHTML").textContent = ixpNameHTML;
  document.getElementById("ixpCountryHTML").textContent = ixpCountryHTML;
  document.getElementById("ixpCustomersHTML").textContent = ixpCustomersHTML;

  document.getElementById("asnIdHTML").textContent = "";
  document.getElementById("asnCountryHTML").textContent = "";
  document.getElementById("asnCustomersHTML").textContent = "";

  document.getElementById("cCodeHTML").textContent = "";
  document.getElementById("noOfIXPsHTML").textContent = "";
  document.getElementById("noOfASNsHTML").textContent = "";
}

/**
 * Displays information about a hovered asn such as it's name, id and neighbours
 * @param  {Object} d - Country element
 */
function hoverASN(d, i) {
  //
  let asnIdHTML = " ASN ID : " + d.id;
  let asnCountryHTML = " Country Name :  " + d.country;
  let asnCustomerHTML = " Customers : ";
  for (let [key, value] of d.map) {
    asnCustomerHTML = asnCustomerHTML + value + " : " + key + ", ";
  }
  document.getElementById("asnIdHTML").textContent = asnIdHTML;
  document.getElementById("asnCountryHTML").textContent = asnCountryHTML;
  document.getElementById("asnCustomersHTML").textContent = asnCustomerHTML;

  document.getElementById("cCodeHTML").textContent = "";
  document.getElementById("noOfIXPsHTML").textContent = "";
  document.getElementById("noOfASNsHTML").textContent = "";

  document.getElementById("ixpIdHTML").textContent = "";
  document.getElementById("ixpNameHTML").textContent = "";
  document.getElementById("ixpCountryHTML").textContent = "";
  document.getElementById("ixpCustomersHTML").textContent = "";
}

//Changes state variables and makes a call to the eventhandler by passing in the currently clicked country

/**
 * Displays information about a hovered asn such as it's name, id and neighbours
 * @param  {Object} d - Country element
 */
function clickCountry(d, i) {
  document.getElementById("ixplevelcontrol").style.display = "none";
  document.getElementById("radiobuttons").style.display = "initial";
  resetLevelComponent();

  //clickToZoom(ZOOM_COUNTRY_CLICK);
  var bounds = path.bounds(d),
    dx = bounds[1][0] - bounds[0][0],
    dy = bounds[1][1] - bounds[0][1],
    x = (bounds[0][0] + bounds[1][0]) / 2,
    y = (bounds[0][1] + bounds[1][1]) / 2,
    scale = Math.max(1, Math.min(5, 0.9 / Math.max(dx / width, dy / height))),
    translate = [width / 2.5 - scale * x, height / 2.25 - scale * y];

  svg
    .transition()
    .duration(750)
    .call(
      zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );

  document.getElementById("allixpsandasns").checked = false;

  if (currentView == "national") {
    revertToCountryInherit();
  } else if (currentView == "IXP") {
    revertToIXPInherit();
  } else {
    resetProcessed();
    document.getElementById("radio-1").checked = true;
  }

  let clickedCountry = d.properties.country_code;
  previousCountry = d.properties.country_code;

  currentView = "national";

  countryView(clickedCountry);
}
/**
 * Resets the "processed" property of every asn in the map back to false
 */
function resetProcessed() {
  asnsbyid.each(function (asn) {
    asn.processed = false;
  });
}


/**
 * Applies the transition whenever a zoom event was triggered
 */
function zooming() {
  g.transition()
    .duration(750) // To prevent stroke width from scaling
    .attr(
      "transform",
      "translate(" +
        width / 2 +
        "," +
        height / 2 +
        ")scale(" +
        k +
        ")translate(" +
        -x +
        "," +
        -y +
        ")"
    )
    .style("stroke-width", 1.5 / k + "px");
}


/**
 * Makes the user selected country element visible and delegates the process of displaying a countries internal relationships, asns and ixps
 * @param  {String} country : 3-digit country code for the clicked country
 */
function countryView(country) {
  g.selectAll(".country").style("visibility", function (value) {
    return value.properties.country_code == country ? "visible" : "hidden";
  });

  showAllCountry(country);
}

/**
 * Ensures that only ASN's & IXP's and it's internal relationships within the clicked country are displayed by using a passed in country reference
 * @param  {String} country : 3-digit country code for the clicked country
 */
function showAllCountry(country) {
  let countryC2pStatus = c2pStatus() ? "inherit" : "hidden";
  let countryP2pStatus = p2pStatus() ? "inherit" : "hidden";
  let countryS2sStatus = s2sStatus() ? "inherit" : "hidden";
  g.select(`#${country}.country`)
    .selectAll(".ASN")
    .each(function (d) {
      let currentAsN = d;
      if (d.CountryLevel <= level) {
        d3.select(this).style("visibility", "inherit");
        d3.select(this)
          .select("circle")
          .attr("fill", countryFill)
          .style("stroke", countryFill)
          .attr("r", 1);
        currentAsn = d3
          .select(this)
          .selectAll("g")
          .each(function (d) {
            currentGroup = d3.select(this);
            currentGroup.selectAll("line").style("visibility", function (d) {
              let destinationAsn = asnsbyid.get(
                d3.select(this).attr("destination")
              );
              //Country check: Ensure the destination asn for the current relationship is in the same country
              if (destinationAsn.country == country) {
                //Destination in layer below must be hidden
                if (destinationAsn.CountryLevel > currentAsN.CountryLevel) {
                  return "hidden";
                }
                //Destination in same layer requires to check if destination has been processed before
                else if (
                  destinationAsn.CountryLevel == currentAsN.CountryLevel
                ) {
                  return destinationAsn.processed ? "hidden" : "inherit";
                }
                //Destination in layer above must be drawn
                else {
                  return "inherit";
                }
              } else {
                return "hidden";
              }
            });

            if (currentGroup.attr("class") == "c2p") {
              currentGroup.style("visibility", countryC2pStatus);
            } else if (currentGroup.attr("class") == "p2p") {
              currentGroup.style("visibility", countryP2pStatus);
            } else {
              currentGroup.style("visibility", countryS2sStatus);
            }
          }); // end for every relationship container
        asnsbyid.get(d.id).processed = true;
      } // if in the current country level
      else {
        d3.select(this).style("visibility", "hidden");
      }
    });
}
/**
 * Hides the previously displayed country elements (asns, ixps & relationships)
 */
function revertToCountryInherit() {
  document.getElementById("radio-1").checked = true;

  g.select(`#${previousCountry}.country`)
    .selectAll(".ASN")
    .style("visibility", "inherit")
    .each(function (d) {
      let cASN = d3.select(this);
      cASN.select("circle").style("fill", continentalFill).attr("r", 1.5);
      cASN
        .selectAll("g")
        .style("visibility", "inherit")
        .selectAll("line")
        .style("visibility", "inherit");
      d.processed = false;
    });
}
/**
 * Hides the previously displayed ixp elements (ixp, asn customers & relationships)
 */
function revertToIXPInherit() {
  g.select(`#${previousIXP.country}.country`)
    .selectAll(`#IXP_${previousIXP.id}`)
    .each(function (d) {
      d3.select(this).style("visibility", "inherit");
    });

  countryAsns.forEach(function (country) {
    g.select(`#${country}.country`)
      .selectAll(".ASN")
      .each(function (d, i) {
        if (asnViewMap.get(d.id) != null) {
          //remove found asn from list?
          d3.select(this)
            .style("visibility", "inherit")
            .selectAll("g")
            .style("visibility", "inherit")
            .selectAll("line")
            .style("visibility", "inherit");

          asnsbyid.get(d.id).processed = false;
        }
      });
  });
}


/**
 * Draws or removes all the asns, ixps and their relationships on a continent-wide level based on the value of the flag parameter passed in
 * @param  {Boolean} showFlag - Determines if the continental elements must be drawn (showFlag = true ) or not (showFlag = false)
 */
function drawEverything(showFlag) {
  showFlag = showFlag ? "visible" : "hidden";

  if (showFlag === "hidden") {
    g.selectAll(".country").style("visibility", showFlag);
  } else {
    let countryC2pStatus = c2pStatus() ? "inherit" : "hidden";
    let countryP2pStatus = p2pStatus() ? "inherit" : "hidden";
    let countryS2sStatus = s2sStatus() ? "inherit" : "hidden";

    g.selectAll(".country").each(function (d) {
      let cCountry = d3.select(this);
      cCountry.style("visibility", showFlag);
      //
      cCountry.selectAll(".ASN").each(function (d) {
        let currentAsN = d;
        if (d.AfricaLevel <= level) {
          d3.select(this).style("visibility", "inherit");
          d3.select(this)
            .select("circle")
            .style("fill", continentalFill)
            .style("stroke", continentalFill)
            .attr("r", 1.5);
          currentAsn = d3
            .select(this)
            .selectAll("g")
            .each(function (d) {
              currentGroup = d3.select(this);
              currentGroup.selectAll("line").style("visibility", function (d) {
                let destinationAsn = asnsbyid.get(
                  d3.select(this).attr("destination")
                );

                //Destination in layer below must be hidden
                if (destinationAsn.AfricaLevel > currentAsN.AfricaLevel) {
                  return "hidden";
                }
                //Destination in same layer requires to check if destination has been processed before
                else if (destinationAsn.AfricaLevel == currentAsN.AfricaLevel) {
                  //
                  return destinationAsn.processed ? "hidden" : "inherit";
                }
                //Destination in layer above must be drawn
                else {
                  return "inherit";
                }
              });

              if (currentGroup.attr("class") == "c2p") {
                currentGroup.style("visibility", countryC2pStatus);
              } else if (currentGroup.attr("class") == "p2p") {
                currentGroup.style("visibility", countryP2pStatus);
              } else {
                currentGroup.style("visibility", countryS2sStatus);
              }
            });

          d.processed = true;
        } else {
          d3.select(this).style("visibility", "hidden");
        }
      });
    });
  }
}
/**
 * EventListener that triggers callbacks to ensure that the only asns displayed are wihtin the user specified quartile range
 * @param  {Number} d - Corresponds to the quartile selected by the user
 */
function conesLevel(d) {
  if (d != level) {
    level = d;
    if (currentView == "national") {
      resetProcessed();
      countryView(previousCountry);
    } else if (currentView == "continental") {
      resetProcessed();
      drawEverything(true);
    }
  }
}
/**
 * Draws or hides asns & relationships based on whether the user increased or decreased the level to be displayed for an ixp view
 * @param  {Number} l - User selected ixp customer level
 */
function levelClick(l) {
  resetProcessed();

  previousLevel = level;
  level = +l;
  leveltest = " Level " + level;
  //document.getElementById("levelhtml").textContent = leveltest;

  if (currentView == "IXP") {
    if (previousLevel < level) {
      for (let i = previousLevel + 1; i <= level; i++) {
        levelsN(i);

      }
    } else {
      countryAsns.forEach(function (country) {
        g.select(`#${country}.country`)
          .selectAll(".ASN")
          .each(function (d, i) {
            asnLevel = +asnViewMap.get(d.id.toString());
            if (asnLevel > level && asnLevel <= previousLevel) {
              d3.select(this).style("visibility", "inherit");
              d3.select(this).selectAll("line").style("visibility", "inherit");
            }
          });
      });
    }
  }

}

/**
 * Specifies the duration of a zoom transition when the UI zoom button is pressed along with the scaling factor
 * @param  {Number} zoomStep - constant scale change per click
 */
function clickToZoom(zoomStep) {
  svg.transition().duration(ZOOM_DURATION).call(zoom.scaleBy, zoomStep);
}

/**
 * Resets the zoom values to project the initial continental view upon a UI button click
 */
function resetZoom() {
  svg
    .transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity); // updated for d3 v4
}

/**
 * The type of transformation applied when a zooming event occurs
 */
function zoomed() {
  g.attr("transform", d3.event.transform);
}
/**
 * Ensures that the UI component responsible for reducing and increasing the ixp view levels are disabled or displayed based on the user selected click
 * It delegates the process of showing a subset of asns and relationships to the levelClick function
 */
function decreaseLevel() {
  let c = document.getElementById("levelsText").innerHTML;
  if (c >= 2) {
    if (c == 2) {
      document.getElementById("decrease").disabled = true;
      document.getElementById("decrease").style.backgroundColor = "grey";
    }
    c = +c - 1;
  }

  document.getElementById("increase").disabled = false;
  document.getElementById("increase").style.backgroundColor = "black";

  document.getElementById("levelsText").textContent = c + "";
  levelClick(c);
}
/**
 * Ensures that the UI component responsible for increasing the ixp view levels are displayed when the user triggers this method
 * It delegates the process of showing a superset of asns and relationships to the levelClick function
 */
function increaseLevel() {
  let c = document.getElementById("levelsText").innerHTML;
  c = +c + 1;
  document.getElementById("levelsText").textContent = c + "";

  document.getElementById("decrease").disabled = false;
  document.getElementById("decrease").style.backgroundColor = "black";

  levelClick(c);
}
/**
 * Resets the UI level component with which the user normally selects the quartile for asns to displayed
 */
function resetLevelComponent() {
  level = 1;
  previousLevel = null;

  document.getElementById("levelsText").textContent = "1";

  document.getElementById("increase").disabled = false;
  document.getElementById("increase").style.backgroundColor = "black";

  document.getElementById("decrease").disabled = true;
  document.getElementById("decrease").style.backgroundColor = "grey";
}

/**
 * Modifies the property customers property to become an array data structure containing all the customers of an asn
 * @param  {Array} arr - list of ixp elements
 */
function typeIxp(arr) {
  for (let index = 0; index < arr.length; index++) {
    let d = arr[index];

    // d[0] = +d.longitude;
    // d[1] = +d.latitude;

    if (d.customers) {
      d.customers = d.customers.split(",");
    } else {
      d.customers = [];
    }
    arr[index] = d;
  }
  return arr;
}

/**
 * Modifies the ASN elements by adding a processed attribute and by parsing the map attribute values into a map datastructure
 * @param  {Array} arr - list of array elements
 */
function typeAsn(arr) {
  for (let index = 0; index < arr.length; index++) {
    let d = arr[index];

    d.processed = false;

    if (d.map) {
      let kv_pairs = d.map.split(" ");
      d.map = new Map();
      kv_pairs.forEach(function (pair) {
        split_pairs = pair.split(":");
        d.map.set(split_pairs[0], split_pairs[1]);
      });
    } else {
      d.map = new Map();
    }
    arr[index] = d;
  }
  return arr;
}
/**
 * Generates the dates dropdown elements based on the number of available files that backend returned during the initialization of the app
 */
function datesDropdown() {
  var select = document.getElementById("selectNumber");

  let datesDrop = dateList["dates"];

  for (let i = 0; i < datesDrop.length; i++) {
    let year = datesDrop[i];
    let el = document.createElement("option");

    el.textContent = year;
    el.value = year;
    el.className = "year";

    select.appendChild(el);
  }
}

d3.select(self.frameElement).style("height", height + "px");
