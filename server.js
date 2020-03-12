var express = require('express');
var mysql = require('mysql');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http');
//var formidable = require('formidable');
var fs = require('fs');
var ejs = require('ejs');
upload = require("express-fileupload");

//Database Pool Connection Functions
var pool = mysql.createPool({
    connectionLimit : 10,
    host            : 'gradeasy-db.ctg4zrkh4rc2.us-east-1.rds.amazonaws.com',
    user            : 'admin',
    password        : 'GradeasyTest',
    database        : 'gradeasy'
});

pool.getConnection(function(error, connection){
    if (error) throw error;
    console.log("connected to pool")
    connection.release();
}); 




var app = express();
app.use(upload());
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

            pool.getConnection(function(error, connection){
                if (error) throw error;
                connection.query('SELECT * FROM Users WHERE EmailAddress = ?', [emailInput], function(error, results) {
                    if (results.length === 0) {  
                        connection.query('INSERT INTO Users (FirstName, LastName, EmailAddress, Password) Values(?,?,?,?)', [firstNameInput, lastNameInput, emailInput, passwordInput], function(error, results){
                            if(error) throw error;
                            console.log("registered account:\n  -"+firstNameInput+" "+lastNameInput+"\n  -"+emailInput+"\n  -"+passwordInput);
                        });
                        response.redirect('/login');
                    } else {
                        console.log("Email account already exists in database!");
                        response.end();
                    }
                });
                connection.release();
            });
        }else{
            console.log("Passwords do not match!");
            response.end();
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

        pool.getConnection(function(error, connection){
            if (error) throw error;
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
            });
            connection.release();
        });
    }
    else{
        console.log("Not enough info entered!");
        response.end();
    }
    
});


//User Dashboard Functions
app.get('/dashboard/:id',function(request,response){
    if (request.session.loggedin) {

        pool.getConnection(function(error, connection){
            if (error) throw error;
            connection.query('SELECT * FROM Classes WHERE Userid = ?', [request.originalUrl.substring(request.originalUrl.indexOf(':')+1)], function(error, classes) {
                var classes = JSON.parse(JSON.stringify(classes));
                var user = request.session.user[0];
                response.render('dashboard',{classes: classes, user: user});
            });
            connection.release();
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

        pool.getConnection(function(error, connection){
            if (error) throw error;
            connection.query('SELECT * FROM Classes WHERE Userid = ? AND ClassName = ?', [userid,classNameInput], function(error, results) {
                if (results.length === 0) {  
                    connection.query('INSERT INTO Classes (Userid, ClassName) Values(?,?)', [userid,classNameInput], function(error, results){
                        if(error) throw error;
                        console.log("Created class " + classNameInput +" for user with id "+ userid);
                        response.redirect('/dashboard/:'+userid);
                    });
                } else {
                    console.log("class already exists in database");
                    response.end();
                }
            });
            connection.release();
        });
    }else{
        console.log("Must have class name!");
        response.end();
    }
});

//Class Dashboard Functions
app.get('/class/:id',function(request,response){
    if (request.session.loggedin) {

        pool.getConnection(function(error, connection){
            if (error) throw error;
            connection.query('SELECT * FROM Classes WHERE Classid = ?', [request.originalUrl.substring(request.originalUrl.indexOf(':')+1)], function(error, classid) {
                connection.query('SELECT * FROM Assignments WHERE Classid = ?', [request.originalUrl.substring(request.originalUrl.indexOf(':')+1)], function(error, Assignments) {
                    var assignments = JSON.parse(JSON.stringify(Assignments));
                    var classInfo = JSON.parse(JSON.stringify(classid));
                    request.session.class = classInfo;
                    response.render('class', {classInfo: request.session.class, user: request.session.user, assignments: assignments});
                });
            });
            connection.release();
        });        	
	} else {
		response.redirect('/login');
	}
});

//Student List Functions
app.get('/class/students/:id',function(request,response){

    if (request.session.loggedin) {


        pool.getConnection(function(error, connection){
            if (error) throw error;
            connection.query('SELECT * FROM Students WHERE Classid = ?', [request.session.class[0].Classid], function(error, students) {
                var studentList = JSON.parse(JSON.stringify(students));
                response.render('students', {classInfo: request.session.class, studentList: studentList, user: request.session.user});  
            }); 
            connection.release();
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
        pool.getConnection(function(error, connection){
            if (error) throw error;
            connection.query('SELECT * FROM Students WHERE Classid = ? AND StudentName = ?', [classid,studentNameInput], function(error, results) {
                if (results.length === 0) {  
                    connection.query('INSERT INTO Students (Classid, StudentName) Values(?,?)', [classid,studentNameInput], function(error, results){
                        if(error) throw error;
                        console.log("Created student " + studentNameInput +" for class with id "+ classid);
                        response.redirect('/class/students/:'+classid);
                    });
                } else {
                    response.end();
                    console.log("student already exists in database");
                }
            });
            connection.release();
        });      
    }else{
        console.log("Must have Student name!");
        response.end();
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
        pool.getConnection(function(error, connection){
            if (error) throw error;
            connection.query('SELECT * FROM Assignments WHERE Classid = ? AND AssignmentName = ?', [classid,AssignmentNameInput], function(error, results) {
                if (results.length === 0) {  
                    connection.query('INSERT INTO Assignments (Classid, AssignmentName, AssignmentDescription) Values(?,?,?)', [classid,AssignmentNameInput,AssignmentDescriptionInput], function(error, results){
                        if(error) throw error;
                        console.log("Created assignment " + AssignmentNameInput + " for class with id " + classid + "\nThe assignment description is " + AssignmentDescriptionInput);
                    });
                    connection.query('SELECT Assignmentid FROM Assignments WHERE Classid = ? AND AssignmentName = ?', [classid,AssignmentNameInput], function(error, Assignmentid) {
                        console.log(Assignmentid[0].Assignmentid)
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '1', request.body.question1Answer, request.body.question1Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data q1 for "+ AssignmentNameInput);
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '2', request.body.question2Answer, request.body.question2Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data q2 for "+ AssignmentNameInput);
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '3', request.body.question3Answer, request.body.question3Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data q3 for "+ AssignmentNameInput);
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '4', request.body.question4Answer, request.body.question4Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data q4 for "+ AssignmentNameInput);
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '5', request.body.question5Answer, request.body.question5Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data q5 for "+ AssignmentNameInput);
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '6', request.body.question6Answer, request.body.question6Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data q6 for "+ AssignmentNameInput);
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '7', request.body.question7Answer, request.body.question7Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data 97 for "+ AssignmentNameInput);
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '8', request.body.question8Answer, request.body.question8Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data q8 for "+ AssignmentNameInput);
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '9', request.body.question9Answer, request.body.question9Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data q9 for "+ AssignmentNameInput);
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location) Values(?,?,?,?)', [Assignmentid[0].Assignmentid, '10', request.body.question10Answer, request.body.question10Location], function(error, results){
                            if(error) throw error;
                            console.log("Created meta data q10 for "+ AssignmentNameInput);
                        });
                    });
                    response.redirect('/class/:'+classid);
                } else {
                    response.end();
                    console.log("You already have an assignment with that name");
                }
            });
            connection.release();
        });   
    }else{
        console.log("Must have an Assignment name!");
        response.end();
    }
});

//assignment edit
app.get('/class/assignmentedit/:id',function(request,response){

    pool.getConnection(function(error, connection){
        if (error) throw error;
        connection.query('SELECT * FROM Assignments WHERE  Assignmentid = ?', [request.originalUrl.substring(request.originalUrl.indexOf(':')+1)], function(error, Assignment) {
            console.log(Assignment[0].Assignmentid);
            var assignment = Assignment
            connection.query('SELECT * FROM Assignment_Meta WHERE  Assignmentid = ?', [request.originalUrl.substring(request.originalUrl.indexOf(':')+1)], function(error, Assignment_Meta) {
                //console.log(Assignment_Meta);
                var assignment_meta = JSON.parse(JSON.stringify(Assignment_Meta));
                //console.log(assignment_meta);
                response.render('assignmentedit', {classInfo: request.session.class, assignment: assignment, assignment_meta: assignment_meta});
            });
        });
        connection.release();
    });
    //response.render('assignmentedit', {classInfo: request.session.class, assignment: assignment, assignment_meta: assignment_meta});
});
app.post('/class/assignmentedit/assignmentEdit/:id', function(request, response){

    var AssignmentNameInput = request.body.assignmentName;
    var AssignmentDescriptionInput = request.body.descriptionName;
    classid = request.session.class[0].Classid;
    assignmentid = request.originalUrl.substring(request.originalUrl.indexOf(':')+1);
    pool.getConnection(function(error, connection){
        if (error) throw error;
        connection.query('SELECT * FROM Assignments WHERE Classid = ? AND AssignmentName = ? AND NOT Assignmentid = ?', [classid,AssignmentNameInput, assignmentid], function(error, results) {
                if (results.length === 0) {  

                    connection.query('UPDATE Assignments SET AssignmentName=?, AssignmentDescription=? Where Assignmentid=?', [AssignmentNameInput,AssignmentDescriptionInput, assignmentid], function(error, results){
                        if(error) throw error;
                        console.log("Edited assignment id" + assignmentid +"with name " + AssignmentNameInput + " for class with id " + classid + "\nThe assignment description is " + AssignmentDescriptionInput);
                    });

                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question1Answer, request.body.question1Location, assignmentid, '1'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q1 for "+ AssignmentNameInput);
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question2Answer, request.body.question2Location, assignmentid, '2'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q2 for "+ AssignmentNameInput);
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question3Answer, request.body.question3Location, assignmentid, '3'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q3 for "+ AssignmentNameInput);
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question4Answer, request.body.question4Location, assignmentid, '4'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q4 for "+ AssignmentNameInput);
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question5Answer, request.body.question5Location, assignmentid, '5'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q5 for "+ AssignmentNameInput);
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question6Answer, request.body.question6Location, assignmentid, '6'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q6 for "+ AssignmentNameInput);
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question7Answer, request.body.question7Location, assignmentid, '7'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q7 for "+ AssignmentNameInput);
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question8Answer, request.body.question8Location, assignmentid, '8'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q8 for "+ AssignmentNameInput);
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question9Answer, request.body.question9Location, assignmentid, '9'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q9 for "+ AssignmentNameInput);
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question10Answer, request.body.question10Location, assignmentid, '10'], function(error, results){
                        if(error) throw error;
                        console.log("Edited meta data q10 for "+ AssignmentNameInput);
                    });


                    response.redirect('/class/:'+classid);
                } else {
                    response.end();
                    console.log("You already have an assignment with that name");
                }
            });
            connection.release();
        });   

    var question1Answer = request.body.question1Answer;
    var question1Location = request.body.question1Location;
    var question2Answer = request.body.question2Answer;
    var question2Location = request.body.question2Location;
    var question3Answer = request.body.question3Answer;
    var question3Location = request.body.question3Location;
    var question4Answer = request.body.question4Answer;
    var question4Location = request.body.question4Location;
    var question5Answer = request.body.question5Answer;
    var question5Location = request.body.question5Location;
    var question6Answer = request.body.question6Answer;
    var question6Location = request.body.question6Location;
    var question7Answer = request.body.question7Answer;
    var question7Location = request.body.question7Location;
    var question8Answer = request.body.question8Answer;
    var question8Location = request.body.question8Location;
    var question9Answer = request.body.question9Answer;
    var question9Location = request.body.question9Location;
    var question10Answer = request.body.question10Answer;
    var question10Location = request.body.question10Location;
    console.log(question1Answer +" : " + question1Location);
    console.log(question2Answer +" : " + question2Location);
    console.log(question3Answer +" : " + question3Location);
    console.log(question4Answer +" : " + question4Location);
    console.log(question5Answer +" : " + question5Location);
    console.log(question6Answer +" : " + question6Location);
    console.log(question7Answer +" : " + question7Location);
    console.log(question8Answer +" : " + question8Location);
    console.log(question9Answer +" : " + question9Location);
    console.log(question10Answer +" : " + question10Location);
});


//Print Functions go here



//Grade functions go here
app.get('/class/assignmentGrade/:id',function(request,response){

    assignmentid = request.originalUrl.substring(request.originalUrl.indexOf(':')+1);
    pool.getConnection(function(error, connection){
        if (error) throw error;
        connection.query('SELECT * FROM Assignments WHERE Assignmentid = ?', [assignmentid], function(error, Assignment) {
            response.render('grade', {classInfo: request.session.class, assignment: Assignment});
            connection.release();
        });
    });
});
app.post('/class/assignmentGrade/uploadfile/:id', function(request, response){
    
    assignmentid = request.originalUrl.substring(request.originalUrl.indexOf(':')+1);
    studentName = request.body.studentname;

    pool.getConnection(function(error, connection){
        if (error) throw error;
        connection.query('SELECT * FROM Students WHERE StudentName=?', [studentName], function(error, student) {
            if (student.length > 0){
                var studentid= student[0].StudentClassid;

                if(request.files){
                    var file = request.files.filetoupload;
                    var filename = assignmentid+"_"+studentName+studentid+".png"
                    file.mv("scannerFiles/"+filename, function(error){
                        if(error) throw error;
                        response.redirect('/class/assignmentGrade/:'+assignmentid);
                });
                }
            }else{
                console.log("That student doesn\'t exist")
                response.redirect('/class/assignmentGrade/:'+assignmentid);
            }
            connection.release();
        });
    });

});