var scanRow = document.getElementById("scan-row");
var textRow = document.getElementById("scan-text");
var logo = document.getElementById("logo");

logo.addEventListener("click", function() {
  /*scanRow.innerHTML =
    "<div id='scan-1-container'>\
<p id='scan-text'>Scanner un produit</p>\
</div>";*/
  document.location.href = "index.html";
  document.getElementById("container-video").innerHTML = "";
  scanRow.addEventListener("click", scan);
});

scanRow.addEventListener("click", scan);

function scan() {
  console.log("clicked");

  scanRow.innerHTML =
    "<div id='left-box-scan' class='container'>\
    <h2>Insérer produit <br /> dans le frigo</h2>\
    </div> \
    <div id='right-box-scan' class='container'>\
    <h2>Nutri'Score</h2>\
    </div> ";
  scanRow.removeEventListener("click", scan);

  var scanLeftBox = document.getElementById("left-box-scan");
  var scanRightBox = document.getElementById("right-box-scan");

  scanLeftBox.addEventListener("click", function() {
    scanRightBox.innerHTML = "POO";
  });

  scanRightBox.addEventListener("click", function() {
    scanRow.innerHTML =
      "<div id='scan-right-clicked' class='container'><h2>Nutri'Score</h2></div>";
    document.getElementById("container-video").innerHTML =
      "<div id='container'> <video autoplay='true' id='videoElement'></video> </div>";
    console.log("recept click");
    var video = document.querySelector("#videoElement");

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then(function(stream) {
          video.srcObject = stream;
        })
        .catch(function(err0r) {
          console.log("Something went wrong!");
        });
    }
  });
}
