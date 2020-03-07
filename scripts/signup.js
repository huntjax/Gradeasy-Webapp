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
var submitButton = document.getElementById("submit");

submitButton.onclick = attemptsignup;



function attemptsignup(){

    var firstName = document.getElementById("first-name").value;
    var lastName = document.getElementById("last-name").value;
    var emailInput = document.getElementById("email-address").value;
    var passwordInput = document.getElementById("password").value;
    var passwordInputConfirm = document.getElementById("password-confirm").value;

    if(passwordInput == passwordInputConfirm){
        alert("Created account!\nName: " + firstName + " " + lastName +"\nEmail: "+emailInput + "\nPassword: "+ passwordInput) 
        document.location="login.html";
    }
    else{
        alert("passwords don't match. Please, try again.")
    }
}
//End Main functions