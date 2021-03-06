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

				var track = Quagga.CameraAccess.getActiveTrack();
				var value = false;
				$("#flash").click(function() {
					if (value == false) {
						$("circle.circle").animate(
							{
								opacity: 0.9
							},
							200
						);

						track.applyConstraints({
							advanced: [{ torch: true }]
						});

						value = true;
					} else {
						$("circle.circle").animate(
							{
								opacity: 0.5
							},
							200
						);
						track.applyConstraints({
							advanced: [{ torch: false }]
						});
						value = false;
					}
				});

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
		var track = Quagga.CameraAccess.getActiveTrack();

		var drawingCtx = Quagga.canvas.ctx.overlay,
			drawingCanvas = Quagga.canvas.dom.overlay;

		if (result) {
			// track.applyConstraints({ advanced: [{ torch: true }] });
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

	// track.applyConstraints({ advanced: [{ torch: false }] });

	var requestURL;
	var resultStatus = false;
	var lastResult = "";
	var verif = "";
	var idItem = "2";
	var tipBg = "";
	function novaSelect(string) {
		let yikesT = Number(string);
		switch (yikesT) {
			case 1:
				tipBg = "#01AA02";

				return "1: Non transformé";

			case 2:
				tipBg = "#0FECD00";

				return "2: Ingrédients transformés";

			case 3:
				tipBg = "#FF6600";

				return "3: Aliments transformés";

			case 4:
				tipBg = "#FE0000";

				return "4: Produits ultra transformés";

			default:
				return "Introuvable";
		}
	}

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
					$("#nova_svg").removeClass("clicked");
					$("#nova_svg").tipso("hide");
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

						// console.log([`OLD: ${verif2} !== NEW: ${interface_version} `]);
						verif = idItem;
						// verif2 = interface_version;
						console.log([`OLD: ${verif} !== NEW: ${idItem}`]);
						$("#prodname").css({ opacity: "0", top: "90%" });

						$("#prodname").addClass("on");

						$("#prodname").animate(
							{
								opacity: 1,
								top: "75%"
							},
							500
						);

						// $("#prodname").velocity({
						// p:  {
						//     top :"75%",
						//     opacity : "1"
						//   },
						// o:{ duration: 500}
						// }
						// );

						// $("#prodname").empty();

						lastResult = code;

						console.log(lastResult);

						var string = "";

						var indice = prod.nutrition_grade_fr;
						indice = indice.toUpperCase();
						var allerg = prod.allergens;
						var brand = prod.brands_tags[0];
						var nutrim = prod.nutriments;
						var prot = nutrim.proteins;
						var ingredients = prod.ingredients_text_fr;
						var nova = prod.nova_group;
						console.log(prod);
						console.log(prod.product_name);

						string += [`<div id='text'>`];
						string += [`<h1>${prod.product_name}</h1>`];
						string += [`<div id="brand-inline">`];
						string += [`<p id="brand">${brand} <span id="indice" /></p>`];
						string += [` </div>`];

						string += [`</div>`];
						string += [`<div class="novacont">`];
						string += [
							`<svg version="1.1" id="nova_svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\
							viewBox="0 0 427.7 427.5" style="enable-background:new 0 0 427.7 427.5;" xml:space="preserve">\
					   <style type="text/css">\
						   .st0{fill:#EEEEEE;}\
						   .st1{fill:#2B7B57;}\
						   .st2{fill:#49B86E;}
					   </style>\
					   <circle class="st0" cx="214" cy="213.8" r="213.6"/>\
					   <g id="XMLID_232_">\
						   <path id="XMLID_235_" class="st1" d="M324.6,283H211.5l-0.4,80.2h95.2c11.5,0,22.1-6.1,27.8-16.1l13.9-24.2l-0.8-0.4L324.6,283z"/>\
						   <path id="XMLID_238_" class="st1" d="M160,184.9l-69.3-40.3l-47.5,82.6c-5.7,9.9-5.7,22.1,0,32.1L56.9,283h46.7L160,184.9z"/>\
						   <path id="XMLID_241_" class="st1" d="M214.1,90.7c0,0,56.1,97.7,56.1,97.7l69.7-39.6l-47.5-82.6c-5.7-10-16.3-16.1-27.8-16.1H237\
							   v0.8L214.1,90.7z"/>\
						   <path id="XMLID_244_" class="st2" d="M186.1,261.2h-0.4c-4.9,0-8.8,3.9-8.8,8.8v13H56.9l39.7,68.5c4.2,7.2,11.8,11.6,20.1,11.6\
							   h60.1v13c0,4.9,3.9,8.8,8.8,8.8h0c2.3,0,4.6-0.9,6.2-2.6l53.3-53.3c3.4-3.4,3.4-9,0-12.5L211.5,283l-19.2-19.2\
							   C190.6,262.1,188.4,261.2,186.1,261.2z"/>\
						   <path id="XMLID_308_" class="st2" d="M191.5,173.7l0.2-0.4c2.4-4.2,1-9.6-3.3-12l-11.3-6.5l36.9-64.1L237,50.9v-0.8h-73.9\
							   c-11.6,0-22.2,6.2-27.9,16.3l-27.4,48.5l-11.3-6.5c-4.2-2.4-9.6-1-12,3.2l0,0c-1.2,2-1.5,4.4-0.9,6.7l7.1,26.2l12.5,46.5\
							   c1.3,4.7,6.1,7.5,10.8,6.2l72.2-19.5C188.5,177.2,190.4,175.7,191.5,173.7z"/>\
						   <path id="XMLID_312_" class="st2" d="M357,178.5l11.3-6.5c4.2-2.4,5.7-7.8,3.2-12l0,0c-1.2-2-3.1-3.5-5.3-4.1l-72.7-19.6\
							   c-4.7-1.3-9.5,1.5-10.8,6.2l-19.5,72.2c-0.6,2.3-0.3,4.7,0.9,6.7l0.2,0.4c2.4,4.2,7.8,5.7,12,3.3l11.3-6.5l37.1,64.5l22.7,39.4\
							   l0.8,0.4l36.8-64.1c5.7-9.9,5.7-22.1,0-32L357,178.5z"/>\
					   </g>\
					   </svg>`
						];

						string += [`</div>`];

						string += [`<br /><div id="desc">`];
						string += [`<h3 class="def">Informations</h3> <br /> <br />`];

						// if (indice.length > 0) {
						// 	string += [
						// 		`<p><strong>Indice de qualité</strong> : ${indice}</p>`
						// 	];
						// }
						function nutString() {
							var entries = Object.entries(nutrim);
							// var keys = Object.keys(nutrim);
							// var values = Object.values(nutrim);
							var entriesProd = Object.entries(prod);

							entriesProd.forEach(function(entry){

								var key1 = entry[0];
								var value1 = entry[1];
								

								if (value1){
									console.log(`${key1} == ${value1}`);
									switch(key1){

										case "origins_fr":
											string += `<p class="nutrimClass"><strong>Provenance:</strong> ${value1}</p>`;
											break;
										default:
											break;
									}
								}

							})

							entries.forEach(function(entry) {
								var key = entry[0];
								var value = entry[1];
								var cValue = Number(value);
								

								if (cValue > 0) {
									console.log(`${key} == ${cValue}`);
									switch (key) {
										case "fat":
											string += `<p class="nutrimClass"><strong>Matière Grasse:</strong> ${cValue}g</p>`;
											break;
										case "sugars":
											string += `<p class="nutrimClass"><strong>Sucre:</strong> ${cValue}g</p>`;
											break;
										case "fiber":
											string += `<p class="nutrimClass"><strong>Fibres:</strong> ${cValue}g</p>`;
											break;
										case "proteins_value":
											string += `<p class="nutrimClass"><strong>Protéines:</strong> ${cValue}g</p>`;
											break;
										case "calcium_value":
											string += `<p class="nutrimClass"><strong>Calcium:</strong> ${cValue}g</p>`;
											break;
										case "magnesium":
											string += `<p class="nutrimClass"><strong>Magnésium:</strong> ${cValue}g</p>`;
											break;
										case "energy":
											string += `<p class="nutrimClass"><strong>Energie:</strong> ${cValue}g</p>`;
											break;
										default:
											break;
									}
								}

								// if (value > 0) {
								// 	// return `<strong>${key}:</strong> ${value}`;
								// 	string += `<strong>${key}:</strong> ${value}, `;
								// } else {
								// 	string += "";
								// }
							});
						}
						nutString();
						//  ${nutString(nutrim.proteins)}${nutString(nutrim.energy)}${nutString(nutrim.calcium)}
						// nutString();
						// // string += [`<p>${nutString()}<p>`];
						// string += [`<p><strong>Code barre: </strong> ${code}</p>`];
						// if (ingredients.length > 30) {
						// 	string += [
						// 		`<p class="text-center"><strong>Ingrédients:</strong> <span style="font-size:12px;text-align:justify;line-height:0.1;">${ingredients}</span></p>`
						// 	];
						// } else {
						// 	string += [`<p><strong>Ingrédients:</strong> ${ingredients}</p>`];
						// }
						// if (allerg.length > 0) {
						// 	string += [
						// 		`<p><strong>Allergènes ou intolérances:</strong> ${allerg}</p><br />`
						// 	];
						// }

						string += [`</div>`];

						var imgArticle = [`<img class="img" src="${prod.image_url}" />`];

						$("#prodname").html(imgArticle + string);
						$("#prodname").prepend("<hr />");
						$("#desc").prepend("<hr />");
						if(prod.product_name.length > 13){
							$("#text > h1").css({
								fontSize:"30px"
							})

						}
						// $("#nova_svg").attr({
						// 	tipso: "yooooAAAAAAAAAAA",
						// 	"data-tipso-title": "nova"
						// });
						$("#nova_svg").tipso({
							titleContent: "Nova",
							content: `${novaSelect(nova)}`,
							delay: 0,
							hideDelay: 0,
							position: "top",
							background: `${tipBg}`,
							color: "#eee",
							size: "normal",
							titleColor: "#ffffff",
							showArrow: true
						});

						$("#nova_svg").click(function(e) {
							e.stopPropagation();
							e.preventDefault();

							$(this).addClass("ripple");

							setTimeout(() => {
								$(this).removeClass("ripple");
							}, 500);

							// $("nova_svg").tipso({
							// 	animationIn: "bounceIn",
							// 	animationOut: "bounceOut"
							// });
							if ($(this).hasClass("clicked")) {
								$(this).removeClass("clicked");
								$(this).tipso("hide");
							} else {
								$(this).addClass("clicked");
								$(this).tipso("show");
							}
						});

						$(document).click(e => {
							e.stopPropagation();
							$("#nova_svg").removeClass("clicked");
							$("#nova_svg").tipso("hide");
						});

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

		App.lastResult = "";
		$("body").css("background-color", "#034d8c");

		if (res == false) {
			res = true;
			verif = true;
			lastResult = "";
			idItem = "";

			$("span#logo").addClass("ripple");

			setTimeout(() => {
				$("span#logo").removeClass("ripple");
			}, 500);

			// transform: perspective(15px) translateZ(1px);

			$("#nav-icon3, #rows-container, .col-12, .sidebar").removeClass(
				"open openM openT openS"
			);

			$("#scan-row").fadeIn(100);

			$("#frigo-stream-row").fadeIn(200);

			$("#recettes-row").fadeIn(300);

			$("#listes-row").fadeIn(400);

			$(".viewport")
				.css("display", "none")
				.animate(
					{
						opacity: 0
					},
					0
				);
			$("#nova_svg").removeClass("hvr-grow-shadow");
			$("#prodname").removeClass("on up");
			$("#prodname").empty();
			$("#flash").css({
				display: "none"
			});

			$("circle.circle").animate(
				{
					opacity: 0
				},
				0
			);

			$("path.thunder").animate(
				{
					opacity: 0
				},
				0
			);

			$("#errorMess").css({
				display: "none",
				opacity: 0
			});

			Quagga.stop();
		}
	});

	const openers = $("#rows-container,.col-12,.sidebar,#nav-icon3");
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

	$("#scan-row").click(function(e) {
		e.preventDefault();

		$("body").css("background-color", "#262626");

		res = false;
		$("#nav-icon3, #rows-container, .col-12, .sidebar").removeClass(
			"open openM openS openT"
		);
		$("#scan-row,#frigo-stream-row,#listes-row,#recettes-row").fadeOut("fast");
		$(".viewport").animate(
			{
				opacity: 1
			},
			2000
		);

		$(".viewport").css("display", "block");

		$("#Calque_1")
			.addClass("on")
			.css("display", "block")
			.animate(
				{
					opacity: 1
				},
				2000
			);

		$("#flash").css("display", "block");

		$("circle.circle").animate(
			{
				opacity: 0.5
			},
			2000
		);

		$("path.thunder").animate(
			{
				opacity: 1
			},
			2000
		);

		setTimeout(function() {
			$("#errorMess").css({
				display: "block",
				opacity: 1
			});
		}, 2000);

		App.init();
	});

	$("#frigo-stream-row").click(function(e) {
		e.preventDefault();
		res = false;

		alert("Mon frigo");
	});

	$("#recettes-row").click(function(e) {
		e.preventDefault();
		res = false;

		alert("Recettes");
	});

	$("#listes-row").click(function(e) {
		e.preventDefault();
		res = false;

		alert("Listes de course");
	});

	// $("UI-LOG")
});
