// function that creates standard format answer sheet
function draw(){

    myWindow = window.open("", "_parent", "width=2408, height=3508"); // "_parent" neccessary width and height are set to that of a normal paper with default DPI printing
    myWindow.document.write('<html><h1 font="30px Arial">"Assignment Name"</h1></html>') // insert assignment name here
    myWindow.document.write('<canvas id="myCanvas" height=2408 width=3508 style="border:2px solid #white;"></canvas>')

    var numberOfQuestions = 10;

        var d = myWindow.document.getElementById("myCanvas");
        var dtx = d.getContext("2d");

        d.width = 3508;
        d.height = 2408;

        dtx.canvas.width  = 3508;
        dtx.canvas.height = 2408;

    for(let i = 0; i < numberOfQuestions; i++){
        if (i!=0) {
            var number = 100*(i)
        } else{
            var number = 50*(i)
        }

        var c = myWindow.document.getElementById("myCanvas");
        var ctx = c.getContext("2d");
        ctx.beginPath();

        ctx.font = "30px Arial";
        ctx.rect(100, number+100, 300, 50); // (x,y,width,height)

        if (i==0) {
            ctx.rect(775, 10, 300, 50);
            ctx.fillText("Name:",675,43);
        }
        
        ctx.stroke();

        var x = i+1; // the number the question is on

        ctx.fillText(x+'.', 5, number+140); // Writes numbner example: "1."

    }

    myWindow.print()

}

