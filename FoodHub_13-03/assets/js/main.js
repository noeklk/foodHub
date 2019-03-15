/*var scanRow = document.getElementById("scan-row");
var textRow = document.getElementById("scan-text");
var logo = document.getElementById("logo");

scanRow.addEventListener("click", scan);

logo.addEventListener("click", function() {
  /*scanRow.innerHTML =
    "<div id='scan-1-container'>\
<p id='scan-text'>Scanner un produit</p>\
</div>";
  document.location.href = "index.html";
});

function scan() {
  console.log("clicked");

  scanRow.removeEventListener("click", scan);
}
*/

window.addEventListener("load", async e => {
  if ("serviceWorker" in navigator) {
    try {
      navigator.serviceWorker.register("sw.js");
      console.log("SW registered");
    } catch (error) {
      console.log("SW not registered");
    }
  }
});

$(document).ready(function() {
  var resultCollector = Quagga.ResultCollector.create({
    capture: true,
    capacity: 20,
    blacklist: [
      {
        code: "WIWV8ETQZ1",
        format: "code_93"
      },
      {
        code: "EH3C-%GU23RK3",
        format: "code_93"
      },
      {
        code: "O308SIHQOXN5SA/PJ",
        format: "code_93"
      },
      {
        code: "DG7Q$TV8JQ/EN",
        format: "code_93"
      },
      {
        code: "VOFD1DB5A.1F6QU",
        format: "code_93"
      },
      {
        code: "4SO64P4X8 U4YUU1T-",
        format: "code_93"
      }
    ],
    filter: function(codeResult) {
      // only store results which match this constraint
      // e.g.: codeResult
      return true;
    }
  });
  var App = {
    init: function() {
      var self = this;

      Quagga.init(this.state, function(err) {
        if (err) {
          return self.handleError(err);
        }
        //Quagga.registerResultCollector(resultCollector);

        App.checkCapabilities();
        Quagga.start();
      });
    },
    handleError: function(err) {
      console.log(err);
    },
    checkCapabilities: function() {
      var track = Quagga.CameraAccess.getActiveTrack();
      var capabilities = {};
      if (typeof track.getCapabilities === "function") {
        capabilities = track.getCapabilities();
      }
      this.applySettingsVisibility("zoom", capabilities.zoom);
      this.applySettingsVisibility("torch", capabilities.torch);
    },
    updateOptionsForMediaRange: function(node, range) {
      console.log("updateOptionsForMediaRange", node, range);
      var NUM_STEPS = 6;
      var stepSize = (range.max - range.min) / NUM_STEPS;
      var option;
      var value;
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
      for (var i = 0; i <= NUM_STEPS; i++) {
        value = range.min + stepSize * i;
        option = document.createElement("option");
        option.value = value;
        option.innerHTML = value;
        node.appendChild(option);
      }
    },
    applySettingsVisibility: function(setting, capability) {
      // depending on type of capability
      if (typeof capability === "boolean") {
        var node = document.querySelector(
          'input[name="settings_' + setting + '"]'
        );
        if (node) {
          node.parentNode.style.display = capability ? "block" : "none";
        }
        return;
      }
      if (
        window.MediaSettingsRange &&
        capability instanceof window.MediaSettingsRange
      ) {
        var node = document.querySelector(
          'select[name="settings_' + setting + '"]'
        );
        if (node) {
          this.updateOptionsForMediaRange(node, capability);
          node.parentNode.style.display = "block";
        }
        return;
      }
    },
    initCameraSelection: function() {
      var streamLabel = Quagga.CameraAccess.getActiveStreamLabel();

      return Quagga.CameraAccess.enumerateVideoDevices().then(function(
        devices
      ) {
        function pruneText(text) {
          return text.length > 30 ? text.substr(0, 30) : text;
        }
        var $deviceSelection = document.getElementById("deviceSelection");
        while ($deviceSelection.firstChild) {
          $deviceSelection.removeChild($deviceSelection.firstChild);
        }
        devices.forEach(function(device) {
          var $option = document.createElement("option");
          $option.value = device.deviceId || device.id;
          $option.appendChild(
            document.createTextNode(
              pruneText(device.label || device.deviceId || device.id)
            )
          );
          $option.selected = streamLabel === device.label;
          $deviceSelection.appendChild($option);
        });
      });
    },
    /*_printCollectedResults: function() {
      var results = resultCollector.getResults(),
        $ul = $("#result_strip ul.collector");

      results.forEach(function(result) {
        var $li = $(
          '<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h4 class="code"></h4></div></div></li>'
        );

        $li.find("img").attr("src", result.frame);
        $li
          .find("h4.code")
          .html(result.codeResult.code + " (" + result.codeResult.format + ")");
        $ul.prepend($li);
      });
    }*/
    _accessByPath: function(obj, path, val) {
      var parts = path.split("."),
        depth = parts.length,
        setter = typeof val !== "undefined" ? true : false;

      return parts.reduce(function(o, key, i) {
        if (setter && i + 1 === depth) {
          if (typeof o[key] === "object" && typeof val === "object") {
            Object.assign(o[key], val);
          } else {
            o[key] = val;
          }
        }
        return key in o ? o[key] : {};
      }, obj);
    },
    applySetting: function(setting, value) {
      var track = Quagga.CameraAccess.getActiveTrack();
      if (track && typeof track.getCapabilities === "function") {
        switch (setting) {
          case "zoom":
            return track.applyConstraints({
              advanced: [{ zoom: parseFloat(value) }]
            });
          case "torch":
            return track.applyConstraints({ advanced: [{ torch: !!value }] });
        }
      }
    },
    setState: function(path, value) {
      var self = this;

      if (typeof self._accessByPath(self.inputMapper, path) === "function") {
        value = self._accessByPath(self.inputMapper, path)(value);
      }

      if (path.startsWith("settings.")) {
        var setting = path.substring(9);
        return self.applySetting(setting, value);
      }
      self._accessByPath(self.state, path, value);

      console.log(JSON.stringify(self.state));
      App.detachListeners();
      Quagga.stop();
      App.init();
    },
    inputMapper: {
      inputStream: {
        constraints: function(value) {
          if (/^(\d+)x(\d+)$/.test(value)) {
            var values = value.split("x");
            return {
              width: { min: parseInt(values[0]) },
              height: { min: parseInt(values[1]) }
            };
          }
          return {
            deviceId: value
          };
        }
      },
      numOfWorkers: function(value) {
        return parseInt(value);
      },
      decoder: {
        readers: function(value) {
          if (value === "ean_extended") {
            return [
              {
                format: "ean_reader",
                config: {
                  supplements: ["ean_5_reader", "ean_2_reader"]
                }
              }
            ];
          }
          return [
            {
              format: value + "_reader",
              config: {}
            }
          ];
        }
      }
    },
    state: {
      inputStream: {
        type: "LiveStream",
        constraints: {
          width: { min: 640 },
          height: { min: 480 },
          facingMode: "environment",
          aspectRatio: { min: 1, max: 2 }
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 4,
      frequency: 100,
      decoder: {
        readers: [
          {
            format: "ean_reader",
            config: {}
          }
        ]
      },
      locate: true
    },
    lastResult: null
  };

  Quagga.onProcessed(function(result) {
    var drawingCtx = Quagga.canvas.ctx.overlay,
      drawingCanvas = Quagga.canvas.dom.overlay;

    if (result) {
      if (result.boxes) {
        drawingCtx.clearRect(
          0,
          0,
          parseInt(drawingCanvas.getAttribute("width")),
          parseInt(drawingCanvas.getAttribute("height"))
        );
        result.boxes
          .filter(function(box) {
            return box !== result.box;
          })
          .forEach(function(box) {
            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
              color: "green",
              lineWidth: 2
            });
          });
      }

      if (result.box) {
        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
          color: "#00F",
          lineWidth: 2
        });
      }

      if (result.codeResult && result.codeResult.code) {
        Quagga.ImageDebug.drawPath(
          result.line,
          { x: "x", y: "y" },
          drawingCtx,
          { color: "red", lineWidth: 3 }
        );
      }
    }
  });

  var requestURL;
  var resultStatus = false;
  var lastResult = "";
  var verif = "";
  var idItem = "2";
  // var verif2 = "";
  // var interface_version = "";

  Quagga.onDetected(function(result) {
    var code = result.codeResult.code;

    if (App.lastResult !== code) {
      App.lastResult = code;

      requestURL = "https://ssl-api.openfoodfacts.org/api/v0/product/";
      //Mettre code de reception du code barre ici
      requestURL += code + ".json";
      console.log(requestURL);

      var request = new XMLHttpRequest();
      request.open("GET", requestURL);
      request.onload = function() {
        var data = JSON.parse(request.responseText);
        console.log(data);
        affichage(data);
      };
      request.send();

      //Fonction d'affichage des données du produit recherché
      function affichage(donnees) {
        var code = donnees.code;
        console.log("code = " + code);
        resultStatus = donnees["status"];

        if (
          lastResult !== code &&
          resultStatus == 1 &&
          donnees["status_verbose"] == "product found"
        ) {
          var prod = donnees["product"];

          idItem = prod.id;
          // interface_version = prod["interface_version_created"];

          console.log("Valide étape 1");

          console.log([`OLD: ${verif} !== NEW: ${idItem}`]);
          // console.log([`OLD: ${verif2} !== NEW: ${interface_version} `]);
          if (
            verif !== idItem /*&&
            verif2 !== interface_version*/ &&
            prod.image_url
          ) {
            console.log("Valide étape 2");

            console.log([`OLD: ${verif} !== NEW: ${idItem}`]);
            // console.log([`OLD: ${verif2} !== NEW: ${interface_version} `]);
            verif = idItem;
            // verif2 = interface_version;
            $("#prodname").css({ opacity: "0", top: "90%" });

            $("#prodname").addClass("on");

            $("#prodname").animate(
              {
                opacity: 1,
                top: "75%"
              },
              500
            );

            // $("#prodname").empty();

            lastResult = code;

            console.log(lastResult);

            var string = "";

            var indice = prod.nutrition_grade_fr;
            indice = indice.toUpperCase();
            var allerg = prod.allergens;
            var brand = prod.brands_tags[0];

            console.log(prod);
            console.log(prod.product_name);
            string += [`<div id='text'>`];
            string += [`<h1>${prod.product_name}</h1>`];
            string += [`<div id="brand-inline">`];
            string += [`<p id="brand">${brand} <span id="indice" /></p>`];
            string += [` </div>`];
            string += [`</div> <br />`];
            string += [`<div id="desc">`];
            string += [`<p><strong>Catégorie:</strong> ${prod.categories}<p>`];
            string += [`<p><strong>Code barre: </strong> ${code}</p>`];
            if (indice.length > 0) {
              string += [`<p>Indice de qualité : <span>${indice}</span></p>`];
            }
            string += [
              `<p><strong>Ingrédients:</strong> ${prod.ingredients_text_fr}</p>`
            ];
            if (allerg.length > 0) {
              string += [
                `<p><strong>Allergènes ou intolérances:</strong> ${allerg}</p><br />`
              ];
            }
            string += [`</div>`];

            var imgArticle = [`<img class="img" src="${prod.image_url}" />`];
            $("#prodname").html(imgArticle + string);
            if (indice.length > 0) {
              switch (indice) {
                case "A":
                  // $("#indice").css("background-color" , "green");
                  $("#indice").css("background-color", "#038141");

                  console.log("indice == " + indice);
                  break;

                case "B":
                  $("#indice").css("background-color", "#85BB2F");

                  console.log("indice == " + indice);
                  break;

                case "C":
                  $("#indice").css("background-color", "#FECB02");

                  console.log("indice == " + indice);
                  break;

                case "D":
                  $("#indice").css("background-color", "#EE8100");

                  console.log("indice == " + indice);
                  break;

                case "E":
                  $("#indice").css("background-color", "#E63E11");

                  console.log("indice == " + indice);
                  break;
              }
            }

            // $("#desc span").css("background-color", "red");
          } else {
            console.log("Répétition ! : Annulé (verif)");
          }
        } else {
          console.log("Répétition ! : Annulé");
        }
      }
    }
  });

  $("#prodname").click(function() {
    $("#prodname").toggleClass("up");
  });

  var res = false;

  //Bouton Accueil

  $("#logo").click(function(e) {
    e.preventDefault();

    if (res == false) {
      res = true;
      verif = true;
      lastResult = "";
      idItem = "";

      verif2 = "";
      interface_version = "";

      $("span#logo")
        .addClass("ripple")
        .delay(500)
        .queue(function() {
          $(this)
            .removeClass("ripple")
            .dequeue();
        });

      $("#nav-icon3, #rows-container, .col-12").removeClass("open");
      $(".sidebar").removeClass("active-sidebar");

      $("#scan-row").fadeIn(100);

      $("#frigo-stream-row").fadeIn(200);

      $("#recettes-row").fadeIn(300);

      $("#listes-row").fadeIn(400);

      $(".viewport,#prodname").removeClass("on up");
      // $(".viewport").animate({
      //   opacity : 0

      // });
      $(".viewport").css({ opacity: 0 });
      $("#prodname").empty();
      Quagga.stop();
    }
  });

  var openers = $("#rows-container,.col-12,.sidebar,#nav-icon3");
  //Resize listener

  $(window).resize(function() {
    openers.removeClass("open openM openT openS");
  });

  //Bouton de navigation

  $("#nav-icon3").click(function(e) {
    e.preventDefault();
    res = false;
    function mobile() {
      openers.removeClass("openT openS");
      openers.toggleClass("open openM");
    }
    function tablet() {
      openers.removeClass("openM openS");
      openers.toggleClass("open openT");
    }
    function screen() {
      openers.removeClass(" openM openT");
      openers.toggleClass("open openS");
    }

    if ("matchMedia" in window) {
      // Détection
      if (window.matchMedia("(min-width:1024px)").matches) {
        screen();
      } else if (window.matchMedia("(min-width:600px)").matches) {
        tablet();
      } else {
        mobile();
      }
    }
  });

  //Boutons pour applications

  // $(".svg-wrappers")
  //   .parents("#scan-row")$
  $("#scan-row").click(function(e) {
    e.preventDefault();
    res = false;
    $("#nav-icon3, #rows-container, .col-12").removeClass("open openM openS");
    $(".sidebar").removeClass("open openM openS");
    $("#scan-row,#frigo-stream-row,#listes-row,#recettes-row").fadeOut("fast");
    $(".viewport")
      .addClass("on")
      .animate(
        {
          opacity: 1
        },
        3000
      );

    App.init();
  });

  // $(".svg-wrappers")
  //   .parents("#frigo-stream-row")
  $("#frigo-stream-row").click(function(e) {
    e.preventDefault();
    res = false;

    alert("Mon frigo");
  });

  // $(".svg-wrappers")
  //   .parents("#recettes-row")
  $("#recettes-row").click(function(e) {
    e.preventDefault();
    res = false;

    alert("Recettes");
  });

  // $(".svg-wrappers")
  //   .parents("#listes-row")
  $("#listes-row").click(function(e) {
    e.preventDefault();
    res = false;

    alert("Listes de course");
  });
});
