
function factsapi(){

	

	var varbarcode = document.getElementById("input-api").value;

	document.write(varbarcode);
	document.write("lol");

	var url = "https://ssl-api.openfoodfacts.org/api/v0/product/"+ varbarcode +".json";
	

	window.location.replace(url);
	


}
