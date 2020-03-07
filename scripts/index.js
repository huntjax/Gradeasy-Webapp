//Header functions
document.getElementById("home").addEventListener("click",changeToHome);
document.getElementById("login").addEventListener("click", changeToLogin);
document.getElementById("signup").addEventListener("click",changeToSignUp);
document.getElementById("ContactUs").addEventListener("click",openContactBox);

function changeToHome(){
    document.location="/../views/index.html"
}
function changeToLogin(){
    document.location="/../views/login.html"
}
function changeToSignUp(){
    document.location="/../views/signup.html"
}
function openContactBox(){
    document.getElementById("dropdown").classList.toggle("active");
}

//End Header functions