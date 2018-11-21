const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

let svg = d3.select("#grafico")
    .append("svg")
    .attr("width",WIDTH)
    .attr("height",HEIGHT-10);

let countryName;

let emissionText;

let emissionData = d3.csv("data/annual-co-emissions-per-country.csv");
let populationData = d3.csv("data/population-worldbank.csv");
let landData = d3.csv("data/land-worldbank.csv");
let mapData = d3.json("data/world.geo.json");

Promise.all([emissionData,populationData,landData,mapData])
.then((data)=>{
    let emissionData = data[0];
    let populationData = data[1];
    let landData = data[2];
    let mapData = data[3];
    let features = mapData.features;

    let mode = "total";

    let maxEmission = 0;
    emissionData.filter((data)=>{
        return data.Year == "2016";
    }).forEach((data)=>{
        for(let i=0;i<features.length;i++){
            if(features[i].properties.iso_a3 === data.Code){
                features[i].properties.emissionData = parseFloat(data.Emissions);
                if(parseFloat(data.Emissions) > maxEmission){
                    maxEmission = parseFloat(data.Emissions);
                }
            }
        }
    });

    let maxEmissionPerCapita = 0;
    for(let i=0;i<features.length;i++){
        for(let j=0;j<populationData.length;j++){
            if(features[i].properties.iso_a3 === populationData[j].CountryCode){
                let emission = features[i].properties.emissionData;
                let population = parseFloat(populationData[j]["2016"]);
                features[i].properties.emissionPerCapitaData = emission / population;
                if(features[i].properties.emissionPerCapitaData > maxEmissionPerCapita){
                    maxEmissionPerCapita = features[i].properties.emissionPerCapitaData;
                }
            }
        }
    }

    let maxEmissionPerLand = 0;
    for(let i=0;i<features.length;i++){
        for(let j=0;j<landData.length;j++){
            if(features[i].properties.iso_a3 === landData[j].CountryCode){
                let emission = features[i].properties.emissionData;
                let land = parseFloat(landData[j]["2016"]);
                features[i].properties.emissionPerLandData = emission / land;
                if(features[i].properties.emissionPerLandData > maxEmissionPerLand){
                    maxEmissionPerLand = features[i].properties.emissionPerLandData;
                }
            }
        }
    }


    let projection = d3.geoMercator()
                    .fitExtent([[0,0],[WIDTH-30,HEIGHT-30]],mapData);
    let geoPath = d3.geoPath(projection);

    let colorTotal = d3.scalePow()
                .exponent(0.25)
                .domain([0,maxEmission])
                .range(['white', 'red']);

    let colorPopulation = d3.scalePow()
                .exponent(0.25)
                .domain([0,maxEmissionPerCapita])
                .range(["white","red"]);

    let colorLand = d3.scalePow()
                .exponent(0.25)
                .domain([0,maxEmissionPerLand])
                .range(["white","red"]);

    let zoom = d3.zoom();
    let map = svg
        .append("g")
        .call(zoom.on("zoom",()=>{
            map.attr("transform",d3.event.transform);
        }));
    
    map.selectAll(".country")
        .data(features)
        .enter()
        .append("path")
        .attr("class","country")
        .attr("d",geoPath)
        .style("stroke","black")
        .style("fill",(data)=>{
            return colorTotal(data.properties.emissionData || 0);
        })
        .on("mouseover",mouseOver);

    countryName = svg.append("text")
        .attr("id","name")
        .attr("x","10")
        .attr("y","20")
        .style("fill","black")
        .style("font-family","Courier")
        .style("font-weight","bold")
        .text("");
    
    emissionText = svg.append("text")
        .attr("id","emission")
        .attr("x","10")
        .attr("y",40)
        .style("fill","black")
        .style("font-family","Courier")
        .text("");

    populationText = svg.append("text")
        .attr("id","population")
        .attr("x","10")
        .attr("y","70")
        .style("fill","black")
        .style("font-family","Courier")
        .text("");

    landText = svg.append("text")
        .attr("id","land")
        .attr("x","10")
        .attr("y","100")
        .style("fill","black")
        .style("font-family","Courier")
        .text("");

    d3.select("#mapMode")
    .on("change",function(){
        mode = d3.select("#mapMode").property("value");
        d3.selectAll(".country")
        .style("fill",changeColor);
    });
    
    function changeColor(data){
        switch(mode){
            case "total": return colorTotal(data.properties.emissionData || 0);
            case "population": return colorPopulation(data.properties.emissionPerCapitaData || 0);
            case "land": return colorLand(data.properties.emissionPerLandData || 0);
        }
    }
})
.catch((e)=>{
    alert("Hubo un error al cargar los datos");
    console.error(e);
});

function clone(selector) {
    var node = d3.select(selector).node();
    return d3.select(node.parentNode.appendChild(node.cloneNode(true), node.nextSibling));
}

function mouseOver(data){
    d3.select(".currentCountry").remove();
    let name = data.properties.name;
    let emission = data.properties.emissionData;
    let perCapita = data.properties.emissionPerCapitaData;
    let perLand = data.properties.emissionPerLandData;
    countryName.text(name);
    emissionText.text("Total: "+emission+" Mt");
    populationText.text("Per capita: "+(perCapita*1000000).toFixed(2)+" t/habitant");
    landText.text("By square m: "+(perLand*1000).toFixed(2)+" t/m2");
    let country = clone(this);
    country
        .attr("class","currentCountry")
        .style("stroke","red")
        .on("mouseout",function(){
            console.log("OUT");
            d3.select(this).remove();
        });
}
