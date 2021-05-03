var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var http = require('http');

var igraci;
var korisnik;
var idKorisnika="";

app.set("view engine", 'ejs');
app.use(express.static('public'));

var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('./data/baza.db');

app.get("/",  (req, res) => {
    res.render("login", {validacija1 : "", validacija2 : ""});
});

app.post("/login",urlencodedParser,function(req,res)
{
    var username=req.body.username;
    var lozinka=req.body.lozinka;

    db.all("SELECT * FROM `Korisnik` WHERE username='"+username+"' and password='"+lozinka+"' ",function(err,rows){

        if(err){
            throw err;
        }

        if(rows.length>0)
        {

            korisnik="Welcome, "+rows[0].ime+" "+rows[0].prezime+"!";
            idKorisnika=rows[0].id;
            
            if(rows[0].uloga=="admin")
            {
                db.all("SELECT * FROM Igrac", (err, rowsIgraci) => {

                    if(rowsIgraci.length>0)
                    {
                        igraci=rowsIgraci;
                        res.render("adminPregled",{igraci : igraci, dobrodosli : korisnik, greska:""}); 
                    }

                });
            }
            else
            {
                db.all("SELECT * From Igrac WHERE Tim='Arsenal'", (err,rowsIgraci) => {

                    if(rowsIgraci.length>0)
                    {
                        igraci=rowsIgraci;
                        res.render("igraci",{igraci:igraci, dobrodosli:korisnik, igrac : "", greska:""});
                    }
                });
            }

        }
        else
        {
            res.render("login",{ validacija1: "Pogresno korisnicko ime/lozinka!", validacija2: "" });
        }
    });
});


app.post("/vratiSe", urlencodedParser, (req,res) =>
{
    idKorisnika = "";
    res.render("login", {validacija1:"", validacija2:""});
});

app.post("/adminPregled", urlencodedParser, (req, res) => {
    db.all("SELECT * FROM Igrac", (err, rowsIgraci) => {

        if(rowsIgraci.length>0)
        {
            igraci=rowsIgraci;
            res.render("adminPregled",{igraci : igraci, dobrodosli : korisnik, greska:""}); 
        }
    });
})

app.post("/dodaj", urlencodedParser, (req, res) =>
{

        db.all("SELECT * FROM Igrac ORDER BY id DESC", (err, igraciRows) => {
            if(igraciRows.length > 0)
                res.render("dodaj", { poruka: "", igraci: igraciRows, greska: ""});
            else
                res.render("dodaj", { poruka: "", igraci: "", greska: "Trenutno nemate igraca."});
        });
});

app.post("/prikazi", urlencodedParser, (req,res) =>
{
    var idIgraca=req.body.igracID;


    db.all("SELECT * FROM Igrac i WHERE i.id="+idIgraca+" ORDER BY i.id DESC", (err,rowsIgraci) =>
    {
        if(rowsIgraci.length>0) res.render("prikazi",{ dobrodosli: korisnik, igraci: rowsIgraci, igrac:"", greska:"" });
        else res.render("prikazi",{ dobrodosli: korisnik, igraci:"", greska:"Trenutno nema igraca!"});
    });

});

app.post("/prikaziAdmin", urlencodedParser, (req,res) =>
{
    var idIgraca=req.body.igracID;


    db.all("SELECT * FROM Igrac i WHERE i.id="+idIgraca+" ORDER BY i.id DESC", (err,rowsIgraci) =>
    {
        if(rowsIgraci.length>0) res.render("prikaziAdmin",{ dobrodosli: korisnik, igraci: rowsIgraci, igrac:"", greska:"" });
        else res.render("prikaziAdmin",{ dobrodosli: korisnik, igraci:"", greska:"Trenutno nema igraca!"});
    });

});

app.post("/dodajIgraca", urlencodedParser, (req,res) => {
    var ime = req.body.ime;
    var detalji=req.body.detalji;
    var tim = req.body.tim;

        db.all("SELECT * FROM Igrac WHERE Ime = '" + ime + "' AND Detalji = '" + detalji + "' AND Tim = '" + tim + "'", (err, igraciRows) => {
            if(igraciRows.length > 0)   // igrac postoji vec
            {
                
                    db.all("SELECT * FROM Igrac ORDER BY id DESC", (err, igraciRows) => {
                        if(igraciRows.length > 0)
                            res.render("dodaj", { poruka: "", igraci: igraciRows, greska: ""});
                        else
                            res.render("dodaj", { poruka: "", igraci: "", greska: "Trenutno nemate igraca."});
                    });
                
            }
            else
            {
                
                        db.all("INSERT INTO Igrac (Ime, Detalji, Tim) VALUES('"+ime+"', '"+detalji+"', '"+tim+"')", (err,row) => {
                            if (err) {
                                throw err;
                            }

                           
                                db.all("SELECT * FROM Igrac ORDER BY id DESC", (err, igraciRows) => {
                                    if(igraciRows.length > 0)
                                        res.render("dodaj", { poruka: "", igraci: igraciRows, greska: ""});
                                    else
                                        res.render("dodaj", { poruka: "", igraci: "", greska: "Trenutno nemate igraca."});
                                });
                            
                  
            });
        }
});
});


app.post("/izbaciIzArsenala", urlencodedParser, (req, res) => {
    var idIgraca = req.body.igracID;

    db.all("SELECT * FROM Igrac WHERE id="+idIgraca, (err, igraciRows) => {
        if(igraciRows.length > 0)
        {
            db.run("UPDATE `Igrac` set Tim='Bez tima' WHERE id="+idIgraca+"", (err) => {
                if(err)
                {
                    console.log(err);
                    res.send(false);
                    res.end();
                }
                else
                {
                    db.all("SELECT * FROM Igrac", (err, rowsIgraci) => {
                        if(rowsIgraci.length>0)
                        {
                            igraci=rowsIgraci;
                            res.render("adminPregled", { igraci : igraci, dobrodosli : korisnik, greska:""}); 
                        }
                    });
                }
            });
        }
    });
})

app.post("/UbaciUArsenal", urlencodedParser, (req, res) => {
    var idIgraca = req.body.igracID;

    db.all("SELECT * FROM Igrac WHERE id="+idIgraca, (err, igraciRows) => {
        if(igraciRows.length > 0)
        {
            db.run("UPDATE `Igrac` set Tim='Arsenal' WHERE id="+idIgraca+"", (err) => {
                if(err)
                {
                    console.log(err);
                    res.send(false);
                    res.end();
                }
                else
                {
                    db.all("SELECT * FROM Igrac", (err, rowsIgraci) => {
                        if(rowsIgraci.length>0)
                        {
                            igraci=rowsIgraci;
                            res.render("adminPregled", { igraci : igraci, dobrodosli : korisnik, greska:""}); 
                        }
                    });
                }
            });
        }
    });
})

app.post("/registracija",urlencodedParser,function(req,res)
{
    var ime=req.body.ime;
    var prezime=req.body.prezime;
    var username=req.body.username;
    var lozinka=req.body.lozinka;

    korisnik="Dobro došao/la, "+ime+" "+prezime+"!";

    db.all("SELECT * FROM Korisnik WHERE username='"+username+"'",function(err, kor)
    {
        if(kor.length>0)
            res.render("login", { validacija1: "", validacija2: "Korisnicko ime "+username+" je zauzeto!"});
        else
        {
            db.run("INSERT INTO Korisnik(ime, prezime, username, password, uloga) VALUES ('"+ime+"','"+prezime+"','"+username+"','"+lozinka+"','user')",function(err,kor)
            {
                if(err) 
                {
                    throw err;
                }   
                
                idKorisnika=this.lastID;

                db.all("SELECT * FROM Igrac WHERE Tim='Arsenal'", (err,rowsIgraci) => {

                    if(rowsIgraci.length>0)
                    {
                        igraci=rowsIgraci;
                        res.render("igraci",{igraci:igraci, dobrodosli:korisnik, igrac : "", greska:""});
                    }
                });
            });
        }
    });

});

app.post("/igraci", urlencodedParser, (req,res) =>
{
    db.all("SELECT * FROM Igrac WHERE Tim='Arsenal'", (err,rowsIgraci) => {

        if(rowsIgraci.length>0)
        {
            igraci=rowsIgraci;
            res.render("igraci",{igraci:igraci, dobrodosli:korisnik, igrac : "", greska:""});
        }
        else res.render("igraci",{ dobrodosli: korisnik, igraci:"", greska:"Trenutno nema igraca Arsenala!"});
    });

});

app.post("/pretraga", urlencodedParser, (req,res) =>
{
    var pretraga = req.body.search;

    if(pretraga != "")
    {
        db.all("SELECT * FROM Igrac WHERE Ime LIKE '%"+pretraga+"%' AND Tim='Arsenal' ORDER BY id DESC", (err, rowsIgraci) =>
        {
            if(rowsIgraci.length>0) res.render("igraci",{ dobrodosli: korisnik, igraci: rowsIgraci, igrac:"", greska:"" });
            else res.render("igraci",{ dobrodosli: korisnik, igraci:"", igrac:"", greska:"Trenutno nema igraca!"});
        });
    }
    else
    {
        db.all("SELECT * FROM Igrac WHERE Tim='Arsenal' ORDER BY id DESC", (err, rowsIgraci) =>
        {
            if(rowsIgraci.length>0) res.render("igraci",{ dobrodosli: korisnik, igraci: rowsIgraci, igrac:"", greska:"" });
            else res.render("igraci",{ dobrodosli: korisnik, igraci:"", igrac:"", greska:"Trenutno nema igraca!"});
        });
    }

});

app.post("/adminPretraga", urlencodedParser, (req, res) =>
{
    var pretraga = req.body.search;

    if(pretraga != "")
    {
        db.all("SELECT * FROM Igrac WHERE Ime LIKE '%"+pretraga+"%'", (err, rowsIgraci) =>
        {
            if(rowsIgraci.length>0) res.render("adminPregled", {dobrodosli: korisnik, igraci: rowsIgraci, greska: "" });
            else res.render("adminPregled", {dobrodosli: korisnik, igraci:"", greska: "Trenutno nema igraca!"});
        });
    }
    else
    {
        db.all("SELECT * FROM Igrac", (err, rowsIgraci) =>
        {
            if(rowsIgraci.length>0) res.render("adminPregled",{ dobrodosli: korisnik, igraci: rowsIgraci, igraci:"", greska:"" });
            else res.render("adminPregled",{ dobrodosli: korisnik, igraci:"", igraci:"", greska:"Trenutno nema igraca!"});
        });
    }

});


app.post("/sacuvaj", urlencodedParser, (req,res) => {
    var idIgraca=req.body.igracID;

    db.all("SELECT * FROM Igrac WHERE id="+idIgraca+"", (err, igrac) => {
            
        if(igrac.length > 0)
        {
            //da li cuvanje vec postoji
            db.all("SELECT * FROM KorisnikIIgrac WHERE KorisnikID="+idKorisnika+" AND IgracID="+idIgraca+"", (err, cuvanje) => {
                if(cuvanje.length > 0) //vec postoji, samo ispisati
                {
                    db.all("SELECT * FROM Igrac WHERE id="+idIgraca+" ORDER BY id DESC", (err, rowsIgraci) =>
                    {
                        if(rowsIgraci.length>0)
                        {
                            igraci=rowsIgraci;
                            res.render("prikazi",{ dobrodosli: korisnik, igraci:igraci, igrac: "", greska:"Već ste sačuvali igraca!"}); 
                        }
                    });
                }
                else 
                {
                    
                    
                            db.run("INSERT INTO KorisnikIIgrac(KorisnikID, IgracID) VALUES('"+idKorisnika+"','"+idIgraca+"')", (err) =>
                            {
                                if(err)
                                {
                                    console.log(err);
                                    res.send(false);
                                    res.end();
                                }
                                else
                                {
                                    db.all("SELECT * FROM Igrac WHERE id="+idIgraca+" ORDER  BY id DESC", (err, rowsIgraci) =>
                                    {
                                        if(rowsIgraci.length>0)
                                        {
                                            igraci=rowsIgraci;
                                            res.render("prikazi",{ dobrodosli:korisnik, igraci:igraci, igrac: igrac, greska:""}); 
                                        }
                                    });
                                }
                            });
                        
                    
                }
            });
        }
    });
});

var sacuvaniIgraci; 

app.post("/mojTim", urlencodedParser, (req,res) =>
{
    db.all("SELECT i.* FROM Igrac i JOIN KorisnikIIgrac kii ON i.id = kii.IgracID WHERE kii.KorisnikID = "+idKorisnika, (err, sacuvaniIgraciRows) =>
    {
        if(sacuvaniIgraciRows.length > 0)
        {
            sacuvaniIgraci=sacuvaniIgraciRows;
            res.render("mojTim", { igraci: sacuvaniIgraci, igrac: "", greska: ""});
        }
        else
        {
            res.render("mojTim", { igraci: "", igrac: "", greska: "Još uvek nisi sačuvao ni jednog igraca u svoj tim."});
        }
    });
});


app.post("/ukloni", urlencodedParser, (req,res) => 
{
    var idIgraca = req.body.igracID;

    db.all("SELECT i.* FROM KorisnikIIgrac kii JOIN Igrac i ON i.id = kii.IgracID WHERE kii.KorisnikID="+idKorisnika+" AND kii.IgracID="+idIgraca+"", (err, cuvanje) => {
        if(cuvanje.length > 0) 
        {
            
            db.all("DELETE FROM `KorisnikIIgrac` WHERE IgracID = " + cuvanje[0].id, (err) =>
            {
                
                db.all("SELECT i.* FROM Igrac i JOIN KorisnikIIgrac kii ON i.id = kii.IgracID WHERE kii.KorisnikID = "+idKorisnika, (err, sacuvaniIgraciRows) =>
                {
                    if(sacuvaniIgraciRows.length > 0)
                    {
                        sacuvaniIgraci=sacuvaniIgraciRows;
                        res.render("mojTim", { igraci: sacuvaniIgraci, igrac: "", greska: ""});
                    }
                    else
                    {
                        res.render("mojTim", { igraci: "", igrac: "", greska: "Još uvek nisi sačuvao ni jednog igraca u svoj tim."});
                    }
                });
                    
                
                    });
        }
    });

});

var server = http.createServer(app);
server.listen(3000, "127.0.0.1");
