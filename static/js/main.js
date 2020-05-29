var oReq = new XMLHttpRequest();
var archivo = document.getElementsByName("archivo")[0].value;
var iono = document.getElementsByName("iono")[0].value;
oReq.open("GET", "/api/b?archivo=" + archivo, true);
oReq.responseType = "arraybuffer";

var labf = ["1.4","2.0","2.8","4.0","5.6","8.0","11.3","16 MHz."];
var labh = ["100","200","300","400","500","600","700","km."];
var mask = 0x80;
var xmin = 40;
var xmax = 616;
var ymax = 478;
var anchoVentana = 650;
var altoVentana = 500;

var fnum, fsize, fsite, fofset, fyear, fmonth, fday, fhour, fminute, fsecond, fflags;
var inum, ilcol, ircol, iheight, isize, imonth, iday, ihour, iminute, isecond, iflags;
var data;

var xp, yp,sh, ht, ytop, ymin;

var arrayBuffer;

var c = document.getElementById("myCanvas");
var ctx = c.getContext("2d");

oReq.onload = function (oEvent) {
  arrayBuffer = oReq.response; // Note: not oReq.responseText
  if (arrayBuffer) {
    leeYdibuja();
  }
};

oReq.send(null);

function cambioArchivo() {
  archivo = document.getElementsByName("archivo")[0].value;
  iono = document.getElementsByName("iono")[0].value;
  oReq.open("GET", "/api/b?archivo=" + archivo, true);
  oReq.responseType = "arraybuffer";

  arrayBuffer = oReq.response; // Note: not oReq.responseText
  if (arrayBuffer) {
    leeYdibuja();
  }

  oReq.send(null);
}

function cambioIono() {
  iono = document.getElementsByName("iono")[0].value;
  if (arrayBuffer) {
    leeYdibuja();
  }
}

function leeYdibuja() {
  fnum = new Int16Array(arrayBuffer.slice(0,2))[0];
  fsize = new Int32Array(arrayBuffer.slice(2,6))[0];
  fsite = new Int8Array(arrayBuffer.slice(6,7))[0];
  fofset = new Int8Array(arrayBuffer.slice(7,8))[0];
  fyear = new Int16Array(arrayBuffer.slice(8,10))[0];
  fmonth = new Int8Array(arrayBuffer.slice(10,11))[0];
  fday = new Int8Array(arrayBuffer.slice(11,12))[0];
  fhour = new Int8Array(arrayBuffer.slice(12,13))[0];
  fminute = new Int8Array(arrayBuffer.slice(13,14))[0];
  fsecond = new Int8Array(arrayBuffer.slice(14,15))[0];
  fflags = new Int8Array(arrayBuffer.slice(15,16))[0];
  var pos = 16;
  for (var i = 0; i < fnum; i++) {
    inum = new Int16Array(arrayBuffer.slice(pos,pos+2))[0];
    //console.log(inum);
    ilcol = new Int16Array(arrayBuffer.slice(pos+2,pos+4))[0];
    ircol = new Int16Array(arrayBuffer.slice(pos+4,pos+6))[0];
    iheight = new Int16Array(arrayBuffer.slice(pos+6,pos+8))[0];
    isize = new Int16Array(arrayBuffer.slice(pos+8,pos+10))[0];
    imonth = new Int8Array(arrayBuffer.slice(pos+10,pos+11))[0];
    iday = new Int8Array(arrayBuffer.slice(pos+11,pos+12))[0];
    ihour = new Int8Array(arrayBuffer.slice(pos+12,pos+13))[0];
    iminute = new Int8Array(arrayBuffer.slice(pos+13,pos+14))[0];
    isecond = new Int8Array(arrayBuffer.slice(pos+14,pos+15))[0];
    iflags = new Int8Array(arrayBuffer.slice(pos+15,pos+16))[0];
    data = new Uint8Array(arrayBuffer.slice(pos+16,pos+16+isize*16));
    pos += 16 + 16 * isize;
    //console.log(isize);
    if (i == iono - 1)
      break;

  } // for

  dibuja();
}

function dibuja() {

  var filofset = fofset;
  if (filofset > 0)
    filofset = filofset -32 + (filofset/100)*412 // =>512*f+ht;
  var bitofset = filofset;

  xp = xmin + ilcol - 1;
  ht = iheight;
  sh = 7;
  if (ht < 38)
    sh = 14;
  ymin = ymax -   ht*sh;
  ytop = ymin + 3;
  yp = ymax - bitofset + Math.floor((bitofset+5)/8);

  var i = 0;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, anchoVentana, altoVentana);
  ctx.fillStyle = "blue";
  while (true) {
    var bite = data[i];
    i += 1;
    if (bite != 0) {
      for (var k=0; k<7; k++) {
        if (bite & mask) {
          ctx.fillRect(xp, yp, 1, 1);
        }
        bite <<= 1;
        yp -= 1;    //step 7 hts
        if (ht < 38) {
          yp -= 1;
        }
      } // for
    } else {
      var nz = data[i];
      i += 1;
      yp -= (nz*sh);            // Skip nz zero bytes
      if (nz == 0) {
        break;                  // 2 zeros->end
      }
    } // if
    while (yp < ytop) {
      yp += ht*sh;
      xp += 1;                    // wrap columns
    }
  } // while

  ctx.strokeStyle = "white";
  ctx.fillStyle = "white";
  ctx.strokeRect(xmin, ymin, xmax-xmin, ymax-ymin);
  ctx.font = "15px Arial";
  var lf = 0;
  for (var k=xmin+64; k<=600-1; k+=64) {
    ctx.fillText(labf[lf], k-9, ymax-18);
    lf += 1;
    ctx.fillRect(k, ymax-15, 1, 15);
    ctx.fillRect(k, ymin, 1, 7);
  }
  var lh = 0;
  for (var k=ymax-56; k>=ytop+1; k-=56) {
    ctx.fillText(labh[lh], xmin-35, k+4);
    lh += 1;
    ctx.fillRect(xmin, k, 7, 1);
    ctx.fillRect(xmax-7, k, 7, 1);
  }
  ctx.fillText(labh[7], xmin-25, ytop+20);
  strg = "J3P " + iday.toString().padStart(2, '0') + "/" + imonth.toString().padStart(2, '0') +
    "/" + fyear + " at " + ihour.toString().padStart(2, '0') + ":" +
    iminute.toString().padStart(2, '0') + "." + Math.round(isecond/6)

  ctx.font = "28px Arial";
  ctx.fillText(strg, xmin, 25);

  cambio();
}

function cambio() {

  var foE = document.getElementById("foE").checked;
  var foF = document.getElementById("foF").checked;
  var fmin = document.getElementById("fmin").checked;
  var fEs = document.getElementById("fEs").checked;
  var h1 = document.getElementById("h1").checked;
  var H2 = document.getElementById("H2").checked;
  var M3000 = document.getElementById("M3000").checked;

  if (foE == true) {
    cambio_foE();
  }
  if (foF == true) {
    cambio_foF();
  }
  if (fmin == true) {
    cambio_fmin();
  }
  if (fEs == true) {
    cambio_fEs();
  }
  if (h1 == true) {
    cambio_h1();
  }
  if (H2 == true) {
    cambio_H2();
  }
  if (M3000 == true) {
    cambio_M3000();
  }
}

var LAB = ["", "E","F","m","s", "h","H","M"];
var colr= ['Black', 'Green','Red','Blue','DarkCyan', 'White','Cyan', 'Magenta'];
var fon = [0,2.8284,8.0, 1.4142,4.0, 100,200, 6.];     // 0, f*4,h*2,m
var FR = 1;
var F2C = 184.665;                // F2C = 128/ln2
var FH120 = [1.45, 1.45, 1.55, 1.3, 1.3, 1.3];         //sites 0,1 to 5

function cambio_foE() {
  var checkBox = document.getElementById("foE");

  if (checkBox.checked == true) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "red";
    ctx.fillText('SCALING', xmin+7, ymin+25);

    var yt = [0, (ymin*3+ymax)/4, ymin, (ymin+ymax)/2, (ymin+ymax*3)/4];
    var FH2E = FH120[fsite]*0.5;

    lay = 1;
    ctx.fillStyle = colr[lay];
    ctx.fillText(LAB[lay], xmin+20*lay+112, ymin+25);

    var FO = fon[lay] * FR;
    var cop = Math.floor( Math.log(FO) *F2C + 1.5) + xmin;
    ctx.fillRect(cop, yt[lay], 1, ymax-yt[lay]);

    var FH2 = FH2E;
    var FX = Math.sqrt(FH2*FH2 + FO*FO) + FH2;
    var cxp = Math.floor( Math.log(FX) *F2C + 1.5) + xmin;
    draw_dashed_line(cxp, Math.floor(yt[lay]),  cxp, ymax, colr[lay]);

  } else {
    dibuja();
  }
}

function cambio_foF() {
  var checkBox = document.getElementById("foF");

  if (checkBox.checked == true) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "red";
    ctx.fillText('SCALING', xmin+7, ymin+25);

    var yt = [0, (ymin*3+ymax)/4, ymin, (ymin+ymax)/2, (ymin+ymax*3)/4];
    var FH2E = FH120[fsite]*0.5;

    lay = 2;
    ctx.fillStyle = colr[lay];
    ctx.fillText(LAB[lay], xmin+20*lay+112, ymin+25);

    var FO = fon[lay] * FR;
    var cop = Math.floor( Math.log(FO) *F2C + 1.5) + xmin;
    ctx.fillRect(cop, yt[lay], 1, ymax-yt[lay]);

    var FH2 = FH2E*.9212;
    var FX = Math.sqrt(FH2*FH2 + FO*FO) + FH2;
    var cxp = Math.floor( Math.log(FX) *F2C + 1.5) + xmin;
    draw_dashed_line(cxp, Math.floor(yt[lay]),  cxp, ymax, colr[lay]);

  } else {
    dibuja();
  }
}

function cambio_fmin() {
  var checkBox = document.getElementById("fmin");

  if (checkBox.checked == true) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "red";
    ctx.fillText('SCALING', xmin+7, ymin+25);

    var yt = [0, (ymin*3+ymax)/4, ymin, (ymin+ymax)/2, (ymin+ymax*3)/4];
    var FH2E = FH120[fsite]*0.5;

    lay = 3;
    ctx.fillStyle = colr[lay];
    ctx.fillText(LAB[lay], xmin+20*lay+112, ymin+25);

    var FO = fon[lay] * FR;
    var cop = Math.floor( Math.log(FO) *F2C + 1.5) + xmin;
    ctx.fillRect(cop, yt[lay], 1, ymax-yt[lay]);

  } else {
    dibuja();
  }
}

function cambio_fEs() {
  var checkBox = document.getElementById("fEs");

  if (checkBox.checked == true) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "red";
    ctx.fillText('SCALING', xmin+7, ymin+25);

    var yt = [0, (ymin*3+ymax)/4, ymin, (ymin+ymax)/2, (ymin+ymax*3)/4];
    var FH2E = FH120[fsite]*0.5;

    lay = 4;
    ctx.fillStyle = colr[lay];
    ctx.fillText(LAB[lay], xmin+20*lay+112, ymin+25);

    var FO = fon[lay] * FR;
    var cop = Math.floor( Math.log(FO) *F2C + 1.5) + xmin;
    ctx.fillRect(cop, yt[lay], 1, ymax-yt[lay]);

  } else {
    dibuja();
  }
}

function cambio_h1() {
  var checkBox = document.getElementById("h1");

  if (checkBox.checked == true) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "red";
    ctx.fillText('SCALING', xmin+7, ymin+25);

    var yt = [0, (ymin*3+ymax)/4, ymin, (ymin+ymax)/2, (ymin+ymax*3)/4, 296, 424, 0];
    var FH2E = FH120[fsite]*0.5;
    var dcol= Math.floor( (FR -1.)/.0052 );

    lay = 5;
    ctx.fillStyle = colr[lay];
    ctx.fillText(LAB[lay], xmin+20*lay+112, ymin+25);

    var FO = fon[lay] + dcol/.56;     // ht in km (8th bit is missed)
    var cop = ymax - Math.floor(FO*.56 + .5);                      // col# for FO km
    var cxp = cop*2 - ymax;
    ctx.fillRect(xmin, cop, yt[lay]-xmin, 1);
    ctx.fillRect(xmin, cxp, yt[lay]-xmin, 1);

  } else {
    dibuja();
  }
}

function cambio_H2() {
  var checkBox = document.getElementById("H2");

  if (checkBox.checked == true) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "red";
    ctx.fillText('SCALING', xmin+7, ymin+25);

    var yt = [0, (ymin*3+ymax)/4, ymin, (ymin+ymax)/2, (ymin+ymax*3)/4, 296, 424, 0];
    var FH2E = FH120[fsite]*0.5;
    var dcol= Math.floor( (FR -1.)/.0052 );

    lay = 6;
    ctx.fillStyle = colr[lay];
    ctx.fillText(LAB[lay], xmin+20*lay+112, ymin+25);

    var FO = fon[lay] + dcol/.56;     // ht in km (8th bit is missed)
    var cop = ymax - Math.floor(FO*.56 + .5);                      // col# for FO km
    var cxp = cop*2 - ymax;
    var c3p = cxp*2 - cop;               // for 2*ht (&3*)
    ctx.fillRect(xmin, cop, yt[lay]-xmin, 1);
    ctx.fillRect(xmin, cxp, yt[lay]-xmin, 1);
    if (c3p > ymin)
      ctx.fillRect(xmin, c3p, yt[lay]-xmin, 1);

  } else {
    dibuja();
  }
}

function cambio_M3000() {
  var checkBox = document.getElementById("M3000");

  if (checkBox.checked == true) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "red";
    ctx.fillText('SCALING', xmin+7, ymin+25);

    var yt = [0, (ymin*3+ymax)/4, ymin, (ymin+ymax)/2, (ymin+ymax*3)/4];
    var FH2E = FH120[fsite]*0.5;
    var dcol= Math.floor( (FR -1.)/.0052 );
    var co = [0, 0,0, 0,0,  0,0,384]    // plot col#=ln(F)*128/ln2+1


    lay = 7;
    ctx.fillStyle = colr[lay];
    ctx.fillText(LAB[lay], xmin+20*lay+112, ymin+25);

    var cop = co[lay] + dcol;
    var muf = [cop,ymax-112, cop+22,ymax-140, cop+41,ymax-168, cop+58,ymax-196,
      cop+72,ymax-224, cop+97,ymax-280, cop+118,ymax-336, cop+135,ymax-392];
    ctx.strokeStyle = colr[lay];
    ctx.beginPath();
    ctx.moveTo(muf[0], muf[1]);
    for (var i = 2; i<=14; i+=2)
      ctx.lineTo(muf[i], muf[i+1]);
    ctx.stroke();

  } else {
    dibuja();
  }
}

function draw_dashed_line(x1, y1, x2, y2, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.setLineDash([5, 5]);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}
