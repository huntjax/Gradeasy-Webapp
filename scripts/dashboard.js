//on load
var queryString = decodeURIComponent(window.location.search);
queryString = queryString.substring(queryString.indexOf("user=",0)+5);
document.getElementsByTagName("h1")[0].innerHTML = "Welcome, " + queryString;
// end on load



//header
var signOutButton = document.getElementById("signout");

signOutButton.onclick = signOut;

function signOut(){
    document.location="index.html";
}
//End header



