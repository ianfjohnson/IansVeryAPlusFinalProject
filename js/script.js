$(document).ready(function () {

    ////////////////////
    //GLOBAL VARIABLS://
    ////////////////////

    const GAMESIZE = 8;

    let gameBoard;
    let player;

    let activeA = [];
    let trapA = [];
    let nextA = [];
    let recentA = [];
    let assignCounter = 0;
    let quizCounter = 0;
    let projectCounter = 0;

    let $s = $("#stage");
    let $m = $("#main");
    let $c = $(".cell");
    let $g = $("#game");

    let winWidth = $(window).width();
    let winHeight = $(window).height();

    const today = new Date();
    const MONTHNAME = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    //    const WINGDINGS = ["&#10026;", "&#10047;", "&#10052;", "&#9992;", "&#9991;"];

    let timer;

    /////////////////////
    //OBJECT FUNCTIONS://
    /////////////////////

    function Player(x, y) {
        this.x = x;
        this.y = y;
        this.position = getPosition(x, y);
        this.score = 0;

        this.move = function (dir) {
            let newX = this.x;
            let newY = this.y;
            let cleanUp = this.position;

            let ex = false;

            switch (dir) {
                case "up":
                    if (newY != 0) {
                        newY--;
                        ex = true;
                    } else {};
                    break;
                case "down":
                    if (newY != 7) {
                        newY++;
                        ex = true;
                    } else {}
                    break;
                case "left":
                    if (newX != 0) {
                        newX--;
                        ex = true;
                    } else {}
                    break;
                case "right":
                    if (newX != 7) {
                        newX++;
                        ex = true;
                    } else {}
                    break;
                default:
            };

            if (ex == true) {
                let newP = getPosition(newX, newY);

                this.position = newP;
                this.x = newX;
                this.y = newY;
                Update();
            } else {
                MakeNoise(1);
            };
        };
    };

    function Cell(x, y) {
        this.x = x;
        this.y = y;
        this.position = getPosition(x, y);
        this.id = "#" + this.position;
        this.date;
        this.month;

        this.$c = $(this.id);

        this.nextDay = function () {
            this.assignment = "";

            if (this.position >= 56) {
                let newDay = this.date + 8;

                if (newDay > 31) {
                    newDay -= 31;
                    this.month++;
                    if (this.month > 11) {
                        this.month = 0;
                    };
                }
                this.date = newDay;
            } else {
                this.date = gameBoard[this.position + 8].date;
                this.month = gameBoard[this.position + 8].month;
            };
        };

        this.cleanCell = function () {
            let c = this.id;
            let $c = $(c);
            let $ch = $(c + " h1");
            let $cp = $(c + " p");

            if ($c.hasClass("today") == true) {
                $c.toggleClass("today");
            };

            if ($c.hasClass("trap") == true) {
                $c.toggleClass("trap");
            };


            for (let i = 0; i < MONTHNAME.length; i++) {
                let month = MONTHNAME[i];
                if ($c.hasClass(month) == true) {
                    $c.toggleClass(month);
                };
            };

            if ($c.hasClass("assignment") == true) {
                $c.toggleClass("assignment");
            };

            $ch.text("");
            $cp.text("");
        }

        this.updateCell = function () {
            let $c = $(this.id);
            let $ch = $(this.id + " h2");

            let month = MONTHNAME[this.month];
            $c.addClass(month);

            $ch.text(this.date);

            if (player.position == this.position) {
                $c.addClass("today");
            };



        };
    };

    function Assignment(x, y) {
        this.x = x;
        this.y = y;
        this.position = getPosition(this.x, this.y);
        this.type;
        this.counter;
        this.value;
        this.name;
        this.$li;

        this.nextDay = function () {
            if (this.y > 0) {
                this.y--;
                this.position = getPosition(this.x, this.y);
            } else {
                let c = gameBoard[this.position];
                UpdateRightBanner(this, c, 0);
                player.score -= this.value;
                let shift = activeA.shift();
            };
        };

        let types = ["Quiz", "Assignment", "Project"];
        let r = getRandomInt(100);

        if (r < 20) {
            quizCounter++;
            this.type = types[0];
            this.counter = quizCounter;
            this.value = 20;
        } else if (r >= 21 && r <= 80) {
            assignCounter++;
            this.type = types[1];
            this.counter = assignCounter;
            this.value = 10;
        } else {
            projectCounter++;
            this.type = types[2];
            this.counter = projectCounter;
            this.value = 25;
        };

        this.name = this.type + " " + this.counter;
    };

    function Trap(x, y) {
        this.x = x;
        this.y = y;
        this.position = getPosition(this.x, this.y);
        this.left = true;

        this.nextDay = function () {
            if (this.y != 0) {
                if (this.y >= player.y) {
                    this.chase();
                } else {
                    this.y--;
                    this.left = true;
                }

                this.position = getPosition(this.x, this.y);
            } else {
                let shift = trapA.shift();
            };
        };

        this.chase = function () {
            let xx = Math.abs(this.x - player.x);
            let yy = Math.abs(this.y - player.y);

            if (xx >= yy && this.left == true) {
                if (player.x > this.x) {
                    this.x++;
                } else if (player.x < this.x) {
                    this.x--;
                };
                this.left = false;
            } else {
                this.y--;
                this.left = true;
            };
        }

        //        let types = ["Assignment", "Quiz"];
        //        let r = getRandomInt(100);
        //
        //        if (r < 33) {
        //            quizCounter++;
        //            this.type = types[1];
        //            this.counter = quizCounter;
        //            this.value = 10;
        //        } else {
        //            assignCounter++;
        //            this.type = types[0];
        //            this.counter = assignCounter;
        //            this.value = 5;
        //        };

        //        this.name = this.type + " " + this.counter;
    };

    ////////////////////////
    //RENDERING FUNCTIONS://
    ////////////////////////

    //Draws gameboard//
    let Draw = () => {
        //draw cells
        let insert = "";
        for (let i = 0; i < gameBoard.length; i++) {
            insert += "<div id='" + gameBoard[i].position + "' class='cell'>";
            insert += "<h2>" + gameBoard[i].date + "</h2>"
            insert += "<p></p>";
            insert += "</div>";
        }
        $("#game").html(insert);

        //draw heading
        let month = today.getMonth();
        $("h1:first").html(MONTHNAME[month]);
        PositionElements();

        //
        SetRightBanner();

        //draw player
        let pos = player.position;
        let id = gameBoard[pos].id;
        $(id).addClass("today");

    };

    //Sets css positions of elements//
    let PositionElements = () => {
        SetStage();
    };

    //Sets css position of stage
    function SetStage() {
        winWidth = $(window).width();
        winHeight = $(window).height();

        let $g = $("#game");
        if ($g.length > 0) {
            $("#stage").css({
                "width": winWidth * .8,
                "height": winHeight,
                "margin-left": 0,
                "top": 0
            });

            $(".box").css({
                "width": 416,
            });

            $("#ToDo").css({
                "width": winWidth * .2,
                "height": winHeight,
                "left": winWidth * .8,
                "top": 0
            });
        } else {
            $("#stage").css({
                "width": winWidth * .7,
                "height": winHeight,
                "margin-left": winWidth * .15,
            });

            $(".box").css({
                "width": winWidth * .5
            });
        };
    };

    function SetRightBanner() {
        let $r = $("#ToDo");

        $r.append("<h1>Recent Activity</h1><h2 class='dbg'>Progress: 0%</h2><br/>");
        $r.append("<h2>Feedback</h2><hr><ul class='feedback'></ul>");
        $r.append("<h2>Upcoming Assignments</h2><hr><ul class='upcoming'></ul>");
    }

    let UpdateRightBanner = (a, c, type) => {
        //type 0 = recent feedback (missed)
        //type 1 = recent feedback (scored)
        //type 2 = upcoming assignment

        let date = c.date;
        let month = c.month;

        if (type == 0) {
            MakeNoise(4);
            date += -8;

            if (date < 1) {
                date += 31;
                month--;

                if (this.month > 0) {
                    this.month = 11;
                };
            };
        };

        let due = MONTHNAME[month] + " " + date + " at 11:59pm";

        let insert = "";
        let $ru;
        let l;
        let scored = false;
        //type 0 = recent feedback (missed)
        //type 1 = recent feedback (scored)
        //type 2 = upcoming assignment
        switch (type) {
            case 2:
                let r = getRandomInt(5);
                insert += "<li class='upcoming'><span>" + a.name + "</span><br /><span>" + a.value + " points &#9679; " + due + "</span></li>";

                $ru = $("ul").eq(1);
                $ru.append(insert);

                l = $(".upcoming li").length;
                l--;
                a.$li = $(".upcoming li").eq(l);
                break;
            case 1:
                scored = true;
            case 0:

                let score;
                if (type == 0) {
                    score = 0;
                } else {
                    score = a.value;
                }

                if (scored == true) {
                    let scoreOut = score + "/" + a.value;
                    insert += "<li class='feedback'>&#10004;<span>" + a.name + "</span><br /><span>" + scoreOut + " &#9679; " + due + "</span></li>";
                } else if (scored == false) {
                    let scoreOut = score + "/" + a.value;
                    insert += "<li class='feedback'><span>" + a.name + "</span><br /><span>" + scoreOut + " &#9679; " + due + "</span></li>";
                }

                $ru = $("ul").eq(0);
                $ru.append(insert);

                l = $(".feedback li").length;

                if (l >= 4) {
                    $(".feedback li").eq(0).remove();
                };
                a.$li.remove();
                break;
        };

    };


    ///////////////////
    //EVENT FUNCTIONS//
    ///////////////////

    //begins welcome screen process
    function Welcome() {
        //create box
        let insert = "<h1>Dashboard</h1><hr>";
        insert += "<div id='welcome' class='box'></div>";
        $s.html(insert);

        let $w = $("#welcome");

        //fill box
        insert = "<p><b>Ian's Very A+ Final Project.</b> Use WASD or arrow keys to move your position on the calendar. Try to complete as many assignments as possible, and don't get a B.</p>";
        insert += "<br><br><button id='btnStart' type='button'>Start</button>";

        $w.html(insert);

        //        NewGame();
        //        PositionElements();
    };

    //begins gameplay process
    function NewGame() {
        $("#welcome").remove();

        CreateObjects();

        let startDate = today.getDate();

        for (let i = 0; i < gameBoard.length; i++) {
            let date = gameBoard[i].date;
            if (startDate == date) {
                startDate = "highlander";
                let id = gameBoard[i].id;
                $(id).addClass("today");
            };
        };

        Draw();
        Update();

        //game timer
        StartTimer();

    };

    let Win = () => {
        clearInterval(timer);
        MakeNoise(2);
        //create box
        let insert = "<h1>Dashboard</h1><hr>";
        insert += "<div id='welcome' class='box'></div>";
        $s.html(insert);

        let $w = $("#welcome");

        //fill box
        insert = "<p><b>You completed Ian's Very A+ Final Project!</b> There's no way Ron would give you anything less than 100/100 on this assignment!</p>";
        insert += "<br><br><button id='btnStart' type='button'>Play again</button>";

        $w.html(insert);

        $("#btnStart").click(function () {
            $("#welcome").remove();
            NewGame();
        });

        PositionElements();
    }

    let Lose = () => {
        clearInterval(timer);
        MakeNoise(0);
        //create box
        let insert = "<h1>Dashboard</h1><hr>";
        insert += "<div id='welcome' class='box'></div>";
        $s.html(insert);

        let $w = $("#welcome");

        //fill box
        insert = "<p><b>Oh no!</b> You didn't work hard enough and you only got a B! Shame! Shame!</p>";
        insert += "<br><br><button id='btnStart' type='button'>Play again</button>";

        $w.html(insert);

        $("#btnStart").click(function () {
            $("#welcome").remove();
            NewGame();
        });

        PositionElements();
    }

    //creates gameplay objects
    function CreateObjects() {
        let gameDiv = "<div id='game' class='box'></div>";
        let toDoDiv = "<div id='ToDo'></div>"
        //        let playerDiv = "<div id='player'></div>";
        let insert = gameDiv + toDoDiv;
        $s.append(insert);

        gameBoard = CreateBoard();
        player = CreatePlayer();
    };

    //creates player obj
    function CreatePlayer() {
        let x = today.getDay();
        let y = 0;

        let output = new Player(x, y);

        return output;
    };

    //creates game board
    function CreateBoard() {
        let output = new Array();

        let date = today.getDate();
        let day = today.getDay();
        let month = today.getMonth();

        let startDate = date - day;

        let counter = 0;
        for (let i = 0; i < GAMESIZE; i++) {
            for (let j = 0; j < GAMESIZE; j++) {
                output[counter] = new Cell(j, i);
                output[counter].date = startDate;
                output[counter].month = month;

                if (startDate == date) {
                    output[counter].class += " today";
                    date = "only one!";
                }

                if (startDate == 31) {
                    if (month == 11) {
                        month = 0;
                    } else {
                        month++;
                    }
                    startDate = 1;
                    counter++
                } else {
                    startDate++;
                    counter++;
                };
            };
        };

        return output;
    };

    //creates assignment object
    let CreateAssignment = () => {
        let r = getRandomInt(8);
        activeA[activeA.length] = new Assignment(r, 7);
        let a = activeA[activeA.length - 1];

        let pos = a.position;

        let c = gameBoard[pos];

        UpdateRightBanner(a, c, 2);
    };

    let CreateTrap = () => {
        let r = getRandomInt(8);
        trapA[trapA.length] = new Trap(r, 7);
    };

    ///////////////////////
    //GAMEPLAY FUNCTIONS://
    ///////////////////////

    let SendAssignment = function (a, c) {
        //            let c = gameBoard[a.position];
        let $c = c.$c;

        $c.addClass("assignment");

        let due = "(" + c.month + "/" + c.date + ")"
        //            let insert = "<p class='assignment'>" + a.name + " " + due + "</p>";
        let insert = "<p class='assignment'>" + a.name + "</p>";

        $cp = $(c.id + " p");

        $cp.html(insert);

    };

    let SendTrap = function (t, c) {
        $c = $(c.id);
        $c.addClass("trap");
    };

    //score assignment
    let TurnInAssignment = (a, i) => {
        MakeNoise(3);
        let c = gameBoard[player.position];
        let insert = [];

        insert.push(a.name);
        insert.push(a.value);
        insert.push(c.month);
        insert.push(c.date);

        player.score += a.value;

        let pos = player.position;
        let splice = activeA.splice(i, 1);
        UpdateRightBanner(a, c, 1);
    }

    //set timer
    let StartTimer = () => {
        timer = setInterval(function () {
            UpdateCalendar();
        }, 1000);
    }

    //advance "time"
    let UpdateCalendar = () => {
        for (let i = 0; i < gameBoard.length; i++) {
            gameBoard[i].nextDay();
        }

        if (activeA.length > 0) {
            for (let i = 0; i < activeA.length; i++) {
                activeA[i].nextDay();
            };
        };

        if (trapA.length > 0) {
            for (let i = 0; i < trapA.length; i++) {
                trapA[i].nextDay();
            };
        };

        let r = getRandomInt(100);

        if (r <= 20) {
            CreateTrap();
        } else if (r <= 60 && r > 21) {
            CreateAssignment();
        };

        Update();
    };

    //update cell contents
    let Update = () => {
        for (let i = 0; i < trapA.length; i++) {
            let t = trapA[i];
            if (player.position == t.position) {
                Lose();
            };
        };

        //pickup assignment
        for (let i = 0; i < activeA.length; i++) {
            let a = activeA[i];
            let pos = i;
            if (player.position == a.position) {
                TurnInAssignment(a, pos);
            }
        }

        if (player.score >= 100) {
            player.score = 100;
            Win();
        }

        if (player.score < 0) {
            player.score = 0;
        };

        $(".dbg").html("<h2 class='dbg'>Progress: " + player.score + "%</h2>");

        //update cells
        for (let i = 0; i < gameBoard.length; i++) {
            gameBoard[i].cleanCell();
            gameBoard[i].updateCell();
        };

        //update month class
        //draw heading        
        let $t = $(".today");
        let head;
        for (let i = 0; i < MONTHNAME.length; i++) {
            let month = MONTHNAME[i];
            let $m = $("." + month + " h2");
            if ($t.hasClass(month) == true) {
                head = month;
                $m.css({
                    "color": "black"
                });
            } else {
                $m.css({
                    "color": "#DDD"
                });
            };
        };
        $("h1:first").html(head);

        //update assignments
        if (activeA.length > 0) {
            for (let i = 0; i < activeA.length; i++) {
                let a = activeA[i];
                let pos = a.position;
                let cell = gameBoard[pos]
                SendAssignment(a, cell);
            };
        };

        if (trapA.length > 0) {
            for (let i = 0; i < trapA.length; i++) {
                let t = trapA[i];
                let pos = t.position;
                let cell = gameBoard[pos]
                SendTrap(t, cell);
            };
        };

    };

    //
    //
    let MakeNoise = (type) => {
        let SOUNDARRAY = [];
        //lose game
        SOUNDARRAY[0] = "./media/zapsplat_multimedia_17874.mp3";
        //fail
        SOUNDARRAY[1] = "./media/zapsplat_multimedia_17643.mp3";
        //win
        SOUNDARRAY[2] = "./media/zapsplat_multimedia_12388.mp3";
        //hit
        SOUNDARRAY[3] = "./media/little_robot_sound_factory_Collect_Point_02.mp3";
        //miss
        SOUNDARRAY[4] = "./media/little_robot_sound_factory_Hit_00.mp3";


        let src = SOUNDARRAY[type];

        this.sound = document.createElement("audio");
        this.sound.src = src;
        this.sound.setAttribute("preload", "auto");
        this.sound.setAttribute("controls", "none");
        this.sound.style.display = "none";
        document.body.appendChild(this.sound);

        this.play = function () {
            this.sound.play();
        }
        this.stop = function () {
            this.sound.pause();
        }

        this.play();
    }

    ////////////////////////////
    //MISCELLANEOUS FUNCTIONS://
    ////////////////////////////

    //gets cell position from x,y coord    
    let getPosition = (x, y) => x + (y * 8);

    //rng
    let getRandomInt = (max) => (Math.floor(Math.random() * Math.floor(max)));

    /////////////////////////
    //ONCE LOADED, DO THIS://
    /////////////////////////

    //Print start screen
    Welcome();
    //    NewGame();

    //set initial CSS values
    PositionElements();

    //resize as necessary//
    $(window).resize(function () {
        PositionElements();
    });

    //Buttons//
    $("#btnStart").click(function () {
        $("#welcome").remove();
        NewGame();
    });

    //Keyhandlers
    document.onkeydown = function (e) {
        switch (e.key) {
            case 'w':
            case 'ArrowUp':
                player.move("up");
                break;
            case 's':
            case 'ArrowDown':
                player.move("down");
                break;
            case 'a':
            case 'ArrowLeft':
                player.move("left");
                break;
            case 'd':
            case 'ArrowRight':
                player.move("right");
                break;
            case 'q':
                UpdateCalendar();
                break;
            case 'e':
                Win();
                break;
            case 'r':
                MakeNoise(4);
                break;
            default:
        };
    };
});
