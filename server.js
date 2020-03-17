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
//const spawn = require("child_process").spawn;

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
app.use(express.static('./public'));
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
                    connection.query('INSERT INTO Students (Classid, StudentName,NumAssignments) Values(?,?,?)', [classid,studentNameInput, '0'], function(error, results){
                        if(error) throw error;
                        response.redirect('/class/students/:'+classid);
                    });
                } else {
                    console.log("student already exists in database");
                    response.end();
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
    response.render('assignmentcreation', {user: request.session.user, classInfo: request.session.class});

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
                    connection.query('INSERT INTO Assignments (Classid, AssignmentName, AssignmentDescription, NumTaken) Values(?,?,?,?)', [classid,AssignmentNameInput,AssignmentDescriptionInput,'0'], function(error, results){
                        if(error) throw error;

                    });
                    connection.query('SELECT Assignmentid FROM Assignments WHERE Classid = ? AND AssignmentName = ?', [classid,AssignmentNameInput], function(error, Assignmentid) {
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '1', request.body.question1Answer.toLowerCase(), request.body.question1Location,'0'], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '2', request.body.question2Answer.toLowerCase(), request.body.question2Location,'0'], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '3', request.body.question3Answer.toLowerCase(), request.body.question3Location,'0'], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '4', request.body.question4Answer.toLowerCase(), request.body.question4Location,'0'], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '5', request.body.question5Answer.toLowerCase(), request.body.question5Location,'0'], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '6', request.body.question6Answer.toLowerCase(), request.body.question6Location,'0'], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '7', request.body.question7Answer.toLowerCase(), request.body.question7Location,'0'], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '8', request.body.question8Answer.toLowerCase(), request.body.question8Location,'0'], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '9', request.body.question9Answer.toLowerCase(), request.body.question9Location,'0'], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Assignment_Meta (Assignmentid, question, Answer, Location, NumCorrect) Values(?,?,?,?,?)', [Assignmentid[0].Assignmentid, '10', request.body.question10Answer.toLowerCase(), request.body.question10Location,'0'], function(error, results){
                            if(error) throw error;
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
            var assignment = Assignment
            connection.query('SELECT * FROM Assignment_Meta WHERE  Assignmentid = ?', [request.originalUrl.substring(request.originalUrl.indexOf(':')+1)], function(error, Assignment_Meta) {
                var assignment_meta = JSON.parse(JSON.stringify(Assignment_Meta));
                response.render('assignmentedit', {user: request.session.user, classInfo: request.session.class, assignment: assignment, assignment_meta: assignment_meta});
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
                    });

                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question1Answer.toLowerCase(), request.body.question1Location, assignmentid, '1'], function(error, results){
                        if(error) throw error;
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question2Answer.toLowerCase(), request.body.question2Location, assignmentid, '2'], function(error, results){
                        if(error) throw error;
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question3Answer.toLowerCase(), request.body.question3Location, assignmentid, '3'], function(error, results){
                        if(error) throw error;
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question4Answer.toLowerCase(), request.body.question4Location, assignmentid, '4'], function(error, results){
                        if(error) throw error;
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question5Answer.toLowerCase(), request.body.question5Location, assignmentid, '5'], function(error, results){
                        if(error) throw error;
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question6Answer.toLowerCase(), request.body.question6Location, assignmentid, '6'], function(error, results){
                        if(error) throw error;
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question7Answer.toLowerCase(), request.body.question7Location, assignmentid, '7'], function(error, results){
                        if(error) throw error;
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question8Answer.toLowerCase(), request.body.question8Location, assignmentid, '8'], function(error, results){
                        if(error) throw error;
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question9Answer.toLowerCase(), request.body.question9Location, assignmentid, '9'], function(error, results){
                        if(error) throw error;
                    });
                    connection.query('UPDATE Assignment_Meta SET Answer=?, Location=? WHERE Assignmentid=? and Question=?', [request.body.question10Answer.toLowerCase(), request.body.question10Location, assignmentid, '10'], function(error, results){
                        if(error) throw error;
                    });


                    response.redirect('/class/:'+classid);
                } else {
                    response.end();
                    console.log("You already have an assignment with that name");
                }
            });
            connection.release();
        });   
});


//Print Functions go here



//Grade functions go here
app.get('/class/assignmentGrade/:id',function(request,response){

    assignmentid = request.originalUrl.substring(request.originalUrl.indexOf(':')+1);
    pool.getConnection(function(error, connection){
        if (error) throw error;
        connection.query('SELECT * FROM Assignments WHERE Assignmentid = ?', [assignmentid], function(error, Assignment) {
            response.render('grade', {user: request.session.user, classInfo: request.session.class, assignment: Assignment});
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
                    var filename = assignmentid+"_"+studentName+studentid+".png";
                    var filepath = "ai_folder/scanner_pictures/"+filename;
                    file.mv(filepath, function(error){
                        if(error) throw error;
                    });
                    const { spawn } = require('child_process');
                    const py = spawn('python', ['ai_folder/HelloWorld.py', "scanner_pictures/"+filename]);

                    py.stdout.on('data', function(data) {
                        console.log("Item Graded. Results:")
                        var answerData = data.toString().toLowerCase().replace(/\r?\n|\r/g,' ');
                        var answers = answerData.split(' ');
                        answers.pop;

                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'1', answers[0]], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'2', answers[1]], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'3', answers[2]], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'4', answers[3]], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'5', answers[4]], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'6', answers[5]], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'7', answers[6]], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'8', answers[7]], function(error, results){
                            if(error) throw error
                        });
                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'9', answers[8]], function(error, results){
                            if(error) throw error;
                        });
                        connection.query('INSERT INTO Student_Meta (Studentid, Assignmentid, question, StudentAnswer) Values(?,?,?,?)', [studentid,assignmentid,'10', answers[9]], function(error, results){
                            if(error) throw error;
                        });
                        
                        connection.query('Select * FROM Assignment_Meta Where Assignmentid=?', [assignmentid], function(error, results){
                            if(error) throw error;
                            var correctScore = 0;
                            for(i=0;i<10;i++){
                                if (results[i].Answer.toString() === answers[i]){
                                    connection.query('UPDATE Assignment_Meta SET NumCorrect = NumCorrect+1 WHERE Assignmentid=? and Question=?', [assignmentid, i+1], function(error, results){
                                        if(error) throw error;
                                    }); 
                                    correctScore +=1;
                                }
                            }
                            correctScore = correctScore/10;
                            var grade = correctScore;
                            console.log(grade);
                            if(student[0].Grade != null)
                                grade = (grade+student[0].Grade)/2;
                            connection.query('UPDATE Students SET NumAssignments= ?, Grade=? WHERE StudentClassid=?', [student[0].NumAssignments+1,grade, studentid], function(error, results){
                                if(error) throw error;
                            });

                            connection.query('UPDATE Assignments SET NumTaken= NumTaken+1 Where Assignmentid=?', [assignmentid], function(error, results){
                                if(error) throw error;
                            });
                        });
                    });    
                response.redirect('/class/assignmentGrade/:'+assignmentid);
                }
            }else{
                console.log("That student doesn\'t exist")
                response.redirect('/class/assignmentGrade/:'+assignmentid);
            }
            connection.release();
        });
    });

});