let map = L.map("map", {
  crs: L.CRS.Minecraft,
  zoomControl: true,
  attributionControl: false,
})

map.createPane("tracks")
map.createPane("blocks")
map.createPane("signals")
map.createPane("trains")
map.createPane("portals")
map.createPane("stations")
map.getPane("tracks").style.zIndex = 300
map.getPane("blocks").style.zIndex = 500
map.getPane("signals").style.zIndex = 600
map.getPane("trains").style.zIndex = 700
map.getPane("portals").style.zIndex = 800
map.getPane("stations").style.zIndex = 800

map.getPane("tooltipPane").style.zIndex = 1000

const lmgr = new LayerManager(map)
const tmgr = new TrainManager(map, lmgr)
const smgr = new StationManager(map, lmgr)

let leftSide = false

fetch("api/config.json")
  .then((resp) => resp.json())
  .then((cfg) => {
    const { layers, view, dimensions } = cfg
    const {
      initial_dimension,
      initial_position,
      initial_zoom,
      max_zoom,
      min_zoom,
      zoom_controls,
      signals_on,
    } = view

    map.setMinZoom(min_zoom)
    map.setMaxZoom(max_zoom)

    lmgr.setLayerConfig(layers)
    lmgr.setDimensionLabels(dimensions)
    lmgr.switchToDimension(initial_dimension)

    const { x: initialX, z: initialZ } = initial_position
    map.setView([initialZ, initialX], initial_zoom)

    if (!zoom_controls) {
      map.zoomControl.remove()
    }

    leftSide = signals_on === "LEFT"

    L.control.coords().addTo(map)

    startMapUpdates()
  })

function startMapUpdates() {
  const dmgr = new DataManager()

  let y1 = 0
  let y2 = 0
  let y3 = 0
  let y4 = 0
  let y5 = 0
  let y6 = 0
  let y7 = 0
  let y8 = 0
  let y9 = 0
  let y10 = 0
  let y11 = 0
  let y12 = 0

  let yCoordMin = -1000
  let yCoordMax = 1000

//  option via url params
//  let params = new URLSearchParams(document.location.search);
//  let yCoordMin = parseInt(params.get("miny"), 10);
//  let yCoordMax = parseInt(params.get("maxy"), 10);

//    console.log(yCoordMin)

  dmgr.onTrackStatus(({ tracks, portals, stations }) => {
    yCoordMin = document.getElementById("miny").value;
    yCoordMax = document.getElementById("maxy").value;
    if (yCoordMin == "") { yCoordMin = -1000 }
    if (yCoordMax == "") { yCoordMax = 1000 }

    lmgr.clearTracks()
    lmgr.clearPortals()
    lmgr.clearStations()
    smgr.update(stations)

    tracks.forEach((trk) => {
      const path = trk.path
      if (path.length === 4) {
        y1 = (y(path[0])+y(path[1])+y(path[2])+y(path[3]))/4
        if (y1 < yCoordMax && y1 > yCoordMin) {
          L.curve(["M", xz(path[0]), "C", xz(path[1]), xz(path[2]), xz(path[3])], {
            className: "track",
            interactive: false,
            pane: "tracks",
          }).addTo(lmgr.layer(trk.dimension, "tracks"))
        }
      } else if (path.length === 2) {
        y2 = (y(path[0])+y(path[1]))/2
        if (y2 < yCoordMax && y2 > yCoordMin) {
          L.polyline([xz(path[0]), xz(path[1])], {
            className: "track",
            interactive: false,
            pane: "tracks",
          }).addTo(lmgr.layer(trk.dimension, "tracks"))
        }
      }
    })

    stations.forEach((stn) => {
      y3 = y(stn.location)
      if (y3 < yCoordMax && y3 > yCoordMin) {
        L.marker(xz(stn.location), {
          icon: stationIcon,
          rotationAngle: stn.angle,
          pane: "stations",
        })
          .bindTooltip(stn.name, {
            className: "station-name",
            direction: "top",
            offset: L.point(0, -12),
            opacity: 0.7,
          })
          .addTo(lmgr.layer(stn.dimension, "stations"))
      }
    })

    portals.forEach((portal) => {
      y4 = y(portal.from.location)
      y5 = y(portal.from.location)
      if (y4 < yCoordMax && y4 > yCoordMin && y5 < yCoordMax && y5 > yCoordMin) {
        L.marker(xz(portal.from.location), {
          icon: portalIcon,
          pane: "stations",
        })
          .on("click", (e) => {
            lmgr.switchDimensions(portal.from.dimension, portal.to.dimension)
            map.panTo(xz(portal.to.location))
          })
          .addTo(lmgr.layer(portal.from.dimension, "portals"))
        L.marker(xz(portal.to.location), {
          icon: portalIcon,
          pane: "stations",
        })
          .on("click", (e) => {
            lmgr.switchDimensions(portal.to.dimension, portal.from.dimension)
            map.panTo(xz(portal.from.location))
          })
          .addTo(lmgr.layer(portal.to.dimension, "portals"))
      }
    })
  })

  dmgr.onBlockStatus(({ blocks }) => {
    yCoordMin = document.getElementById("miny").value;
    yCoordMax = document.getElementById("maxy").value;
    if (yCoordMin == "") { yCoordMin = -1000 }
    if (yCoordMax == "") { yCoordMax = 1000 }

    lmgr.clearBlocks()

    blocks.forEach((block) => {
      if (!block.reserved && !block.occupied) {
        return
      }
      block.segments.forEach(({ dimension, path }) => {
        if (path.length === 4) {
          y6 = (y(path[0])+y(path[1])+y(path[2])+y(path[3]))/4
          if (y6 < yCoordMax && y6 > yCoordMin) {
            L.curve(["M", xz(path[0]), "C", xz(path[1]), xz(path[2]), xz(path[3])], {
              className:
                "track " + (block.reserved ? "reserved" : block.occupied ? "occupied" : ""),
              interactive: false,
              pane: "blocks",
            }).addTo(lmgr.layer(dimension, "blocks"))
          }
        } else if (path.length === 2) {
          y7 = (y(path[0])+y(path[1]))/2
          if (y7 < yCoordMax && y7 > yCoordMin) {
            L.polyline([xz(path[0]), xz(path[1])], {
              className:
                "track " + (block.reserved ? "reserved" : block.occupied ? "occupied" : ""),
              interactive: false,
              pane: "blocks",
            }).addTo(lmgr.layer(dimension, "blocks"))
          }
        }
      })
    })
  })

  dmgr.onSignalStatus(({ signals }) => {
    yCoordMin = document.getElementById("miny").value;
    yCoordMax = document.getElementById("maxy").value;
    if (yCoordMin == "") { yCoordMin = -1000 }
    if (yCoordMax == "") { yCoordMax = 1000 }

    lmgr.clearSignals()

    signals.forEach((sig) => {
      y8 = y(sig.location)
      if (y8 < yCoordMax && y8 > yCoordMin) {
        if (!!sig.forward) {
          let iconType = sig.forward.type === "CROSS_SIGNAL" ? chainSignalIcon : autoSignalIcon
          let marker = L.marker(xz(sig.location), {
            icon: iconType(sig.forward.state.toLowerCase(), leftSide),
            rotationAngle: sig.forward.angle,
            interactive: false,
            pane: "signals",
          }).addTo(lmgr.layer(sig.dimension, "signals"))
        }
        if (!!sig.reverse) {
          let iconType = sig.reverse.type === "CROSS_SIGNAL" ? chainSignalIcon : autoSignalIcon
          let marker = L.marker(xz(sig.location), {
            icon: iconType(sig.reverse.state.toLowerCase(), leftSide),
            rotationAngle: sig.reverse.angle,
            interactive: false,
            pane: "signals",
          }).addTo(lmgr.layer(sig.dimension, "signals"))
        }
      }
    })
  })

  dmgr.onTrainStatus(({ trains }) => {
    yCoordMin = document.getElementById("miny").value;
    yCoordMax = document.getElementById("maxy").value;
    if (yCoordMin == "") { yCoordMin = -1000 }
    if (yCoordMax == "") { yCoordMax = 1000 }

    lmgr.clearTrains()
    tmgr.update(trains)

    trains.forEach((train) => {
      let leadCar = null
      if (!train.stopped) {
        if (train.backwards) {
          leadCar = train.cars.length - 1
        } else {
          leadCar = 0
        }
      }

      train.cars.forEach((car, i) => {
        y9 = y(car.leading.location)
        y12 = y(car.trailing.location)
        if (y9 < yCoordMax && y9 > yCoordMin && y12 < yCoordMax && y12 > yCoordMin) {
          let parts = car.portal
            ? [
                [car.leading.dimension, [xz(car.leading.location), xz(car.portal.from.location)]],
                [car.trailing.dimension, [xz(car.portal.to.location), xz(car.trailing.location)]],
              ]
            : [[car.leading.dimension, [xz(car.leading.location), xz(car.trailing.location)]]]

          parts.map(([dim, part]) =>
            L.polyline(part, {
              weight: 12,
              lineCap: "square",
              className: "train" + (leadCar === i ? " lead-car" : ""),
              pane: "trains",
            })
              .bindTooltip(
                train.cars.length === 1
                  ? train.name
                  : `${train.name} <span class="car-number">${i + 1}</span>`,
                {
                  className: "train-name",
                  direction: "right",
                  offset: L.point(12, 0),
                  opacity: 0.7,
                }
              )
              .addTo(lmgr.layer(dim, "trains"))
          )

          if (leadCar === i) {
            let [dim, edge] = train.backwards ? parts[parts.length - 1] : parts[0]
            let [head, tail] = train.backwards ? [edge[1], edge[0]] : [edge[0], edge[1]]
            let angle = 180 + (Math.atan2(tail[0] - head[0], tail[1] - head[1]) * 180) / Math.PI

            L.marker(head, {
              icon: headIcon,
              rotationAngle: angle,
              pane: "trains",
            }).addTo(lmgr.layer(dim, "trains"))
          }
        }
      })
    })
  })
}
