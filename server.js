var express = require('express');
var mysql = require('mysql');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http');
var fs = require('fs');
var ejs = require('ejs');


//Database Connection Functions
var connection = mysql.createConnection({
    host            : 'localhost',
    user            : 'root',
    password        : 'Prehysteria!3',
    database        : 'gradeasytest'
});

connection.connect(function(err){
    if (err) throw err;
});

var app = express();
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');


//Server onstart Functions
app.listen(3000, function(){
    console.log("Server is running on port 3000");
}); 


//Index Functions
app.get('/', function(request,response){
    response.render('index');
});
 app.get('/index', function(request,response){
    response.render('index');
});


//Signup Functions
app.get('/signup', function(request,response){
    response.render('signup');
});
app.post('/signupAuth', function(request, response){
    var firstNameInput = request.body.firstName;
    var lastNameInput = request.body.lastName;
    var emailInput = request.body.email;
    var passwordInput = request.body.password;
    var passwordConfirmInput = request.body.passwordConfirm;

    if(emailInput && passwordInput && firstNameInput && lastNameInput && passwordConfirmInput){
        if(passwordInput === passwordConfirmInput){ 
            connection.query('SELECT * FROM Users WHERE EmailAddress = ?', [emailInput], function(error, results) {
                if (results.length === 0) {  
                    connection.query('INSERT INTO Users (FirstName, LastName, EmailAddress, Password) Values(?,?,?,?)', [firstNameInput, lastNameInput, emailInput, passwordInput], function(error, results){
                        if(error) throw error;
                        console.log("registered account:\n  -"+firstNameInput+" "+lastNameInput+"\n  -"+emailInput+"\n  -"+passwordInput);
                        response.end();
                    });
                    response.redirect('/login');
                } else {
                    console.log("Email account already exists in database!");
                }
                response.end();
            }); 
        }else{
            console.log("Passwords do not match!");
        }   
    }
    else{
        console.log("Must fill in information!");
		response.end();
    }

});


//Login Functions
app.get('/login', function(request,response){
    request.session.loggedin = false;
    response.render('login');
});
app.post('/loginAuth', function(request, response){

    var emailInput = request.body.email;
    var passwordInput = request.body.password;
    if(emailInput && passwordInput){
        connection.query('SELECT * FROM Users WHERE EmailAddress = ? AND Password = ?', [emailInput, passwordInput], function(error, results) {
            if (results.length > 0) {  
                request.session.loggedin = true;
                request.session.user = JSON.parse(JSON.stringify(results));
                console.log("Logging in :" + emailInput + " " + passwordInput)
                response.redirect('/dashboard/:'+request.session.user[0].Userid);
            } else {
                console.log("Incorrect email or password");
                response.redirect('/login');
            }			
            response.end();
        });
    }
    else{
        response.sendFile(path.join(__dirname+'/public/templates/login.html'));
		response.end();
    }
});


//User Dashboard Functions
app.get('/dashboard/:id',function(request,response){
    if (request.session.loggedin) {

        connection.query('SELECT * FROM Classes WHERE Userid = ?', [request.originalUrl.substring(request.originalUrl.indexOf(':')+1)], function(error, classes) {
            var classes = JSON.parse(JSON.stringify(classes));
            var user = request.session.user[0];
            response.render('dashboard',{classes: classes, user: user});
        });
        	
	} else {
		response.redirect('/login');
	}
    
});


//Class Creation Functions
app.get('/dashboard/classcreation/:id',function(request,response){
    response.render('classcreation', {userid: request.originalUrl.substring(request.originalUrl.indexOf(':')+1)});

});
app.post('/dashboard/classcreation/classCreate/:id', function(request, response){

    var classNameInput = request.body.className;
    var userid = request.originalUrl.substring(request.originalUrl.indexOf(':')+1);

    if (classNameInput){
        connection.query('SELECT * FROM Classes WHERE Userid = ? AND ClassName = ?', [userid,classNameInput], function(error, results) {
            if (results.length === 0) {  
                connection.query('INSERT INTO Classes (Userid, ClassName) Values(?,?)', [userid,classNameInput], function(error, results){
                    if(error) throw error;
                    console.log("Created class " + classNameInput +" for user with id "+ userid);
                    response.end();
                });
            } else {
                response.end();
                console.log("class already exists in database");
            }
            response.redirect('/dashboard/:'+userid);
        });
    }else{
        console.log("Must have class name!");
        response.render('classcreation', {userid: request.originalUrl.substring(request.originalUrl.indexOf(':')+1)});

    }
});

//Class Dashboard Functions
app.get('/class/:id',function(request,response){
    if (request.session.loggedin) {

        connection.query('SELECT * FROM Classes WHERE Classid = ?', [request.originalUrl.substring(request.originalUrl.indexOf(':')+1)], function(error, classid) {
            connection.query('SELECT * FROM Assignments WHERE Classid = ?', [request.originalUrl.substring(request.originalUrl.indexOf(':')+1)], function(error, Assignments) {
                var assignments = JSON.parse(JSON.stringify(Assignments));
                var classInfo = JSON.parse(JSON.stringify(classid));
                request.session.class = classInfo;
                response.render('class', {classInfo: request.session.class, user: request.session.user, assignments: assignments});
            });
        });       	
	} else {
		response.redirect('/login');
	}
});

//Student List Functions
app.get('/class/students/:id',function(request,response){

    if (request.session.loggedin) {
        connection.query('SELECT * FROM Students WHERE Classid = ?', [request.session.class[0].Classid], function(error, students) {
            var studentList = JSON.parse(JSON.stringify(students));
            response.render('students', {classInfo: request.session.class, studentList: studentList, user: request.session.user});  
        });    	
	} else {
		response.redirect('/login');
	}
});


//Student Creation Functions
app.get('/class/students/studentcreation/:id',function(request,response){
    response.render('studentcreation', {classInfo: request.session.class});
});
app.post('/class/students/studentcreation/studentCreate/:id', function(request, response){

    var studentNameInput = request.body.studentName;
    classid = request.session.class[0].Classid;

    if (studentNameInput){
        connection.query('SELECT * FROM Students WHERE Classid = ? AND StudentName = ?', [classid,studentNameInput], function(error, results) {
            if (results.length === 0) {  
                connection.query('INSERT INTO Students (Classid, StudentName) Values(?,?)', [classid,studentNameInput], function(error, results){
                    if(error) throw error;
                    console.log("Created student " + studentNameInput +" for class with id "+ classid);
                    response.end();
                });
            } else {
                response.end();
                console.log("student already exists in database");
            }
            response.redirect('/class/students/:'+classid);
        });
    }else{
        console.log("Must have Student name!");
        response.render('studentcreation', {classInfo: request.session.class});

    }
});

//Assignment Creation
app.get('/class/assignmentcreation/:id',function(request,response){
    response.render('assignmentcreation', {classInfo: request.session.class});

});
app.post('/class/assignmentcreation/assignmentCreate/:id', function(request, response){

    var AssignmentNameInput = request.body.assignmentName;
    var AssignmentDescriptionInput = request.body.descriptionName;
    classid = request.session.class[0].Classid;

    if (AssignmentNameInput){
        connection.query('SELECT * FROM Assignments WHERE Classid = ? AND AssignmentName = ?', [classid,AssignmentNameInput], function(error, results) {
            if (results.length === 0) {  
                connection.query('INSERT INTO Assignments (Classid, AssignmentName, AssignmentDescription) Values(?,?,?)', [classid,AssignmentNameInput,AssignmentDescriptionInput], function(error, results){
                    if(error) throw error;
                    console.log("Created assignment " + AssignmentNameInput + " for class with id " + classid + "n/The assignment description is " + AssignmentDescriptionInput);
                    response.end();
                });
            } else {
                response.end();
                console.log("You already have an assignment with that name");
            }
            response.redirect('/class/:'+classid);
        });
    }else{
        console.log("Must have an Assignment name!");
        response.render('assignmentcreation', {classInfo: request.session.class});

    }
});