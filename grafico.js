const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

let svg = d3.select("#grafico")
    .append("svg")
    .attr("width",WIDTH)
    .attr("height",HEIGHT-10);

let countryName;

let emissionText;

let emissionData = d3.csv("data/annual-co-emissions-per-country.csv");
let mapData = d3.json("data/world.geo.json");

Promise.all([emissionData,mapData])
.then((data)=>{
    let emissionData = data[0];
    let mapData = data[1];
    let features = mapData.features;

    let maxEmission = 0;

    emissionData.filter((data)=>{
        return data.Year == "2016";
    }).forEach((data)=>{
        for(let i=0;i<features.length;i++){
            if(features[i].properties.iso_a3 === data.Code){
                features[i].properties.emissionData = data.Emissions;
                if(parseFloat(data.Emissions) > maxEmission){
                    maxEmission = parseFloat(data.Emissions);
                }
            }
        }
    })

    let projection = d3.geoMercator()
                    .fitExtent([[0,0],[WIDTH-30,HEIGHT-30]],mapData);
    let geoPath = d3.geoPath(projection);

    let color = d3.scalePow()
		.exponent(0.25)
                .domain([0,maxEmission])
                .range(['white', 'red']);

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
        .attr("d",geoPath)
        .style("stroke","black")
        .style("fill",(data)=>{
            return color(data.properties.emissionData || 0);
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
    countryName.text(name);
    emissionText.text(emission);
    let country = clone(this);
    country
        .attr("class","currentCountry")
        .style("stroke","red")
        .on("mouseout",function(){
            console.log("OUT");
            d3.select(this).remove();
        });
}

function mouseOut(data){
    
}
