//Header functions
document.getElementById("home").addEventListener("click",changeToHome);
document.getElementById("login").addEventListener("click", changeToLogin);
document.getElementById("signup").addEventListener("click",changeToSignUp);
document.getElementById("ContactUs").addEventListener("click",openContactBox);

function changeToHome(){
    document.location="index.html"
}
function changeToLogin(){
    document.location="login.html"
}
function changeToSignUp(){
    document.location="signup.html"
}
function openContactBox(){
    document.getElementById("dropdown").classList.toggle("active");
}
//End Header functions

//Main functions
document.getElementById("submit").onclick = attemptLogin;


function attemptLogin(){

    var emailInput = document.getElementById("email-address").value;
    var passwordInput = document.getElementById("password").value;

    if(emailInput == "huntjax24@gmail.com" && passwordInput == "password"){
        alert("Login Successful\nemail: "+emailInput+"\npassword: "+passwordInput);
        var queryString= "?user="+emailInput;
        document.location="dashboard.html" + queryString;
    }
    else{
        alert("Login Failed\nemail: "+emailInput+"\npassword: "+passwordInput);
    }
}
//End Main functions