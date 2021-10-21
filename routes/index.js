var express = require('express');
var router = express.Router();
const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://test123:test123@clusteractivity.oqe3k.mongodb.net/LoginDB?retryWrites=true";
const assert = require('assert');
var objectId = require('mongodb').ObjectID;
var id = require('mongodb').id;
const { stringify } = require('querystring');
const { count } = require('console');

var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.redirect('/home')
});

router.get('/Dashboard', enSureAuthencated, authRole('Student'), async function(req, res, next) {
    const client = new MongoClient(uri);
    await client.connect();
    const users = await client.db('LoginDB').collection('data').findOne({});
    console.log(users)
    res.render('Dashboard', { 'data': users });
});
/////////////////////////////////////////////////////////////
router.get('/DashboardProfile', enSureAuthencated, authRole('Student'), async function(req, res, next) {
    const client = new MongoClient(uri);
    await client.connect();
    const users = await client.db('LoginDB').collection('data').findOne({});
    console.log(users)
    res.render('DashboardProfile', { 'data': users });
});
/////////////////////////////////////////////////////////////
router.get('/Dashboardview', enSureAuthencated, authRole('Student'), async function(req, res, next) {
    const client = new MongoClient(uri);
    await client.connect();
    const users = await client.db('LoginDB').collection('data').findOne({});
    const activity = await client.db('LoginDB').collection('data').aggregate([{
            $lookup: {
                from: 'Log',
                localField: 'ActivityName',
                foreignField: 'activity',
                as: 'logDetail'
            }
        },
        {
            $group: { _id: { ActivityName: "$ActivityName", startTime: "$startTime", endTime: "$endTime", score: "$score", studenId: "$logDetail.id" } }
        },
    ]);

    let userID = req.user.username;
    let datas = [];
    for await (const doc of activity) {
        studentList = doc['_id']['studenId']
        if (studentList.includes(userID)) {
            doc['_id']['Joined'] = true;
            datas.push(doc['_id']);
        } else {
            doc['_id']['Joined'] = false;
        }

    }

    console.log(datas);
    res.render('Dashboardview', { 'data': users, 'data2': datas });
});








/////////////////////////////////////////////////////////////
//admin
router.get("/Dashboardadmin", authRole('admin'), async function(req, res) {
        const client = new MongoClient(uri);
        await client.connect();
        const users = await client.db('LoginDB').collection('data').find({}).toArray();
        await client.close()
        console.log(users)
        res.render("Dashboardadmin", { 'data': users });
    })
    /////////////////////////////////////////////////////////////////
    // router.get ( "/EditDashboardadmin",async function ( req, res )  {
    //     const client = new MongoClient(uri);
    //     await client.connect();
    //     const users = await client.db('LoginDB').collection('data').find({}).toArray();
    //     await client.close()
    //     console.log(users)
    //     res.render ( "EditDashboardadmin",{'data':users} );
    // })
    ////////////////////insert///////////////////////////////////
router.get('/insert', async function(req, res, next) {

    res.render("insert");

});

router.post('/insert', async function(req, res, next) {
    const client = new MongoClient(uri);
    const diffTime = new Date(req.body.endTime).getTime() - new Date(req.body.startTime).getTime()
    const dateNow = new Date();

    if (diffTime < 0) {
        return res.redirect('/insert');
    }

    if (new Date(req.body.startTime).getTime() - new Date(req.body.endTime).getTime() < 0)
        await client.connect();
    await client.db('LoginDB').collection('data').insertOne({
        No: Date.now(),
        ActivityName: req.body.ActivityName,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        place: req.body.place,
        score: Math.floor(diffTime / 3600000),
        count: 0
    });

    await client.close();
    res.redirect('/Dashboardadmin');

});



//////////////////////Get////////////////////////////////
router.get('/update/:id', async function(req, res, next) {
    const id = parseInt(req.params.id);
    const client = new MongoClient(uri);
    await client.connect();
    const users = await client.db('LoginDB').collection('data').findOne({ "No": id });
    await client.close()
    console.log(users)
    res.render('update', { 'data': users })
});

////////////////////update/////////////////////////////
router.post('/update/:id', async(req, res) => {
        const id = parseInt(req.params.id);
        const client = new MongoClient(uri);
        const diffTime = new Date(req.body.endTime).getTime() - new Date(req.body.startTime).getTime()
        if (diffTime < 0) return res.redirect('/update/<%=data.No%>');
        await client.connect();
        await client.db('LoginDB').collection('data').updateOne({ 'No': id }, {
            "$set": {
                ActivityName: req.body.ActivityName,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                place: req.body.place,
                score: Math.floor(diffTime / 3600000),
            }
        });
        await client.close();
        res.redirect('/Dashboardadmin');
    })
    ///////////////////Delete////////////////////////////
router.post('/delete/:id', async(req, res) => {
        const id = parseInt(req.params.id);
        const client = new MongoClient(uri);
        await client.connect();
        await client.db('LoginDB').collection('data').deleteOne({ 'No': id });
        await client.close();
        res.redirect('/Dashboardadmin');
    })
    ////////////////////////////////////////////////////

router.get('/listweing/:activityname', async(req, res, next) => {
    const activityName = req.params.activityname;
    const client = new MongoClient(uri);
    await client.connect();
    let weingList = ['bour', 'chiangrang', 'jomtong', 'kaluang', 'lor', 'namtao'];
    let weingCount = [0, 0, 0, 0, 0, 0]

    console.log(activityName);
    console.log(weingList.length);

    for (i = 0; i < weingList.length; i++) {
        countWeing = await client.db('LoginDB').collection('Log').aggregate([{
                $lookup: {
                    from: 'posts',
                    localField: 'id',
                    foreignField: '_id',
                    as: 'postsdetail'
                }

            },
            {
                $match: { "weing": weingList[i], "activity": activityName }
            },
            {
                $group: { _id: { id: "$id", name: "$name", weing: "$weing" } }
            },
            {
                $count: "counts"
            }
        ]);

        for await (const doc of countWeing) {
            // console.log(doc);
            console.log(doc['counts']);
            weingCount[i] = doc['counts'];
        }

    }

    console.log(weingCount);

    let datas = [{
        'ActivityName': activityName,
        'WeingList': weingList,
        'WeingCount': weingCount,
    }];

    console.log(datas);

    res.render('listweing', { 'data': datas });
});

router.get('/listname/:weingname/:activityname', async(req, res, next) => {
    const weingName = req.params.weingname;
    const activityName = req.params.activityname;
    const client = new MongoClient(uri);
    await client.connect();
    let users;
    console.log(weingName);

    let datas = [];

    if (weingName == 'all') {
        users = await client.db('LoginDB').collection('Log').aggregate([{
                $lookup: {
                    from: 'posts',
                    localField: 'id',
                    foreignField: '_id',
                    as: 'postsdetail'
                }

            },
            {
                $match: { "activity": activityName }
            },
            {
                $group: { _id: { id: "$id", name: "$name", weing: "$weing" } }
            }
        ]);
        for await (const doc of users) {
            // console.log(doc);
            datas.push(doc['_id']);
        }


    } else {
        users = await client.db('LoginDB').collection('Log').aggregate([{
                $lookup: {
                    from: 'posts',
                    localField: 'id',
                    foreignField: '_id',
                    as: 'postsdetail'
                }

            },
            {
                $match: { "weing": weingName, "activity": activityName }
            },
            {
                $group: { _id: { id: "$id", name: "$name", weing: "$weing" } }
            }
        ]);
        for await (const doc of users) {
            // console.log(doc);
            datas.push(doc['_id']);
        }

    }

    console.log(datas);
    await client.close();

    res.render('listname', { 'data': datas });

})

router.get('/home', function(req, res, next) {
    res.render('home');
});

router.get("/home/WeingBour", function(req, res) {
    res.render("WeingBour");
});

router.get("/home/WeingChiangRang", function(req, res) {
    res.render("WeingChiangRang");
});

router.get("/home/WeingJomTong", function(req, res) {
    res.render("WeingJomTong");
});

router.get("/home/WeingKaluang", function(req, res) {
    res.render("WeingKaluang");
});

router.get("/home/WeingLor", function(req, res) {
    res.render("WeingLor");
});

router.get("/home/WeingNamTao", function(req, res) {
    res.render("WeingNamTao");
});

router.get("/listname", function(req, res) {
    res.render("listname");
});

function enSureAuthencated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        res.redirect('/users/login');
    }
}

function authRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            res.status(401)
            return res.send('Not allowed')
        }
        next()
    }
}

module.exports = router;