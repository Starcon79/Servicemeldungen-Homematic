/*******************************************************
* 29.03.19 V1.20    Komplett umgeschrieben
*                   UNREACH, STICKY_UNREACH, SABOTAGE hinzugefügt
* 01.04.19 V1.21    Error hinzugefügt
* 02.04.19 V1.22    Übersetung Errormeldungen eingefügt
*                   Unterdrückung des Logeintrags wenn kein Datenpunkt zu einen bestimmten Servicetyp vorhanden ist. Wird nur beim manuellen Starten ausgegeben
* 04.04.19 V1.23    LOWBAT, LOW_BAT und ERROR_NON_FLAT_POSITIONING hinzugefügt
* 11.04.19 V1.24    Replace von ae zu ä usw hinzugefügt (erstmal nur wenn durch obj ausgeführt)
*                   Status_text in eigene Function ausgelaggert
*                   datum seit in eigene function ausgelaggert 
*                   FAULT_REPORTING und DEVICE_IN_BOOTLOADER hinzugefügt
*                   Alle globalen Variablen auf const und let geändert
*                   Alle Nebenfuntionen auf let und const geändert
*                   Update Batterieliste
*                   Fehler bei Sticky_Unreach beseitigt
* 
* Derzeit fehlen: CONFIG_PENDING, UPDATE_PENDING vom alten Script
* Andere theoretisch mögliche LOWBAT_REPORTING, U_SOURCE_FAIL, USBH_POWERFAIL, STICKY_SABOTAGE, ERROR_REDUCED, ERROR_SABOTAGE
*******************************************************/ 
const Version = 1.24;
const logging = true;             //Sollte immer auf true stehen. Bei false wird garnicht protokolliert
const debugging = false;          //true protokolliert viele zusätzliche Infos

const autoAck = true;             //Löschen bestätigbarer Kommunikationsstörungen (true = an, false = aus)

const observation = true;        //Dauerhafte Überwachung der Geräte auf Servicemeldungen aktiv (true = aktiv // false =inaktiv)
const onetime = true;             //Prüft beim Script Start ob derzeit Geräte eine Servicemeldung haben
const with_time = false;           //Hängt die Uhrzeit an die Serviemeldung

//Geräte die nicht überwacht werden sollen. Komma getrennt erfassen
const no_observation = 'LEQ092862x9, XXX';

//pro Fehlertyp kann eine andere Prio genutzt werden
const prio_LOWBAT = 0;
const prio_UNREACH = 0;
const prio_STICKY_UNREACH = 0;
const prio_CONFIG_PENDING = 0;
const prio_UPDATE_PENDING = 0;
const prio_DEVICE_IN_BOOTLOADER = 0;
const prio_ERROR = 0;
const prio_ERROR_CODE = 0;
const prio_FAULT_REPORTING = 0;
const prio_SABOTAGE= 0;
const prio_ERROR_NON_FLAT_POSITIONING = 0;

//Variablen für Servicemeldung in Objekt schreiben // Wenn einer Meldung auftritt wird diese in ein Textfeld geschrieben. Auf dieses kann man dann reagieren
//und z. B. die Nachricht per Telegram verschicken oder in vis anzeigen
const write_message = false;        // true schreibt beim auftreten einer Servicemeldung die Serviemeldung in ein Objekt
const id_Text_Servicemeldung = '';  // Objekt wo die Servicemeldung hingeschrieben werden soll

//Variablen für Pushover
const sendpush = true;     //true = verschickt per Pushover Nachrchten // false = Pushover wird nicht benutzt
const pushover_Instanz0 =  'pushover.0';     // Pushover instance für Pio = 0
const pushover_Instanz1 =  'pushover.1';     // Pushover instance für Pio = 1
const pushover_Instanz2 =  'pushover.2';     // Pushover instance für Pio = 2
const pushover_Instanz3 =  'pushover.3';     // Pushover instance für Pio = -1 oder -2
let prio;
let titel;
let message;
let device = 'TPhone';         //Welches Gerät soll die Nachricht bekommen
//let _device = 'All'; 

//Variablen für Telegram
const sendtelegram = false;            //true = verschickt per Telegram Nachrchten // false = Telegram wird nicht benutzt
const user_telegram = '';             //User der die Nachricht bekommen soll

//Variable zum verschicken der Servicemeldungen per eMail
const sendmail = false;            //true = verschickt per email Nachrchten // false = email wird nicht benutzt

//Ergebnis in Datenfelder schreiben
const write_state = true;          //Schreibt die Ergebnisse der Servicemeldungen in Datenfelder. (true = schreiben, false, kein schreiben)
//nicht benutzte Felder einfach leer lassen --> var id_IST_XXX = '';
const id_IST_LOWBAT = 'Systemvariable.0.Servicemeldungen.Anzahl_LOWBAT'/*Anzahl LOWBAT*/;
const id_IST_LOW_BAT = '';
//const id_IST_G_LOWBAT = '';
const id_IST_UNREACH = 'Systemvariable.0.Servicemeldungen.Anzahl_UNREACH'/*Anzahl_UNREACH*/;
const id_IST_STICKY_UNREACH = 'Systemvariable.0.Servicemeldungen.Anzahl_STICKY_UNREACH'/*Anzahl_STICKY_UNREACH*/;
const id_IST_CONFIG_PENDING = '';
const id_IST_UPDATE_PENDING = '';
const id_IST_DEVICE_IN_BOOTLOADER = '';
const id_IST_ERROR = '';
const id_IST_ERROR_NON_FLAT_POSITIONING = '';
const id_IST_ERROR_CODE = '';
const id_IST_FAULT_REPORTING = '';
const id_IST_SABOTAGE = '';
const id_IST_Gesamt = "Systemvariable.0.Servicemeldungen.Anzahl_GESAMT"/*Anzahl_GESAMT*/;

//Ab hier eigentliches Script
const SelectorLOWBAT  = $('channel[state.id=hm-rpc.*.0.LOWBAT_ALARM$]');
const SelectorLOW_BAT  = $('channel[state.id=hm-rpc.*.0.LOW_BAT_ALARM$]');
const SelectorUNREACH  = $('channel[state.id=hm-rpc.*.0.UNREACH_ALARM$]');
const SelectorSTICKY_UNREACH  = $('channel[state.id=hm-rpc.*.0.STICKY_UNREACH_ALARM$]');
const SelectorCONFIG_PENDING  = $('channel[state.id=hm-rpc.*.0.CONFIG_PENDING_ALARM$]');
const SelectorUPDATE_PENDING  = $('channel[state.id=hm-rpc.*.0.UPDATE_PENDING_ALARM$]');
const SelectorDEVICE_IN_BOOTLOADER  = $('channel[state.id=hm-rpc.*.0.DEVICE_IN_BOOTLOADER_ALARM$]');
const SelectorERROR  = $('channel[state.id=hm-rpc.*.1.ERROR$]');
const SelectorERROR_CODE  = $('channel[state.id=hm-rpc.*.ERROR_CODE$]');
const SelectorFAULT_REPORTING  = $('channel[state.id=hm-rpc.*.4.FAULT_REPORTING$]');
const SelectorSABOTAGE  = $('channel[state.id=hm-rpc.*.0.SABOTAGE_ALARM$]');
const SelectorERROR_NON_FLAT_POSITIONING = $('channel[state.id=hm-rpc.*.0.ERROR_NON_FLAT_POSITIONING_ALARM$]');

function send_pushover (device, message, titel, prio) {
    //Version V4.01 vom 10.04.19
    let pushover_Instanz;
    if (prio === 0){pushover_Instanz =  pushover_Instanz0;}
    else if (prio == 1){pushover_Instanz =  pushover_Instanz1;}
    else if (prio == 2){pushover_Instanz =  pushover_Instanz2;}
    else {pushover_Instanz =  pushover_Instanz3;}
    sendTo(pushover_Instanz, { 
        device: device,
        message: message, 
        title: titel, 
        priority: prio,
        retry: 60,
        expire: 600,
        html: 1
    }); 
}

function send_telegram (messgae, user_telegram) {
    sendTo('telegram.0', { 
        text: messgae,
        user: user_telegram,
        parse_mode: 'HTML'
    }); 

}

function send_mail (messgae) {
    sendTo("email", {
        //from:    "iobroker@mydomain.com",
        //to:      "aabbcc@gmail.com",
        subject: "Servicemeldung",
        text:    messgae
    });


}

function replaceAll(string, token, newtoken) {      
    if(token!=newtoken)
    while(string.indexOf(token) > -1) {
        string = string.replace(token, newtoken);
    }
    return string;
}

function func_translate_status(meldungsart, native_type, status){
    let status_text;
    if(meldungsart == 'UNREACH_ALARM' || meldungsart == 'STICKY_UNREACH_ALARM'){
        if(status === 0){
            status_text = 'keine Kommunikationsfehler';
        }
        else if (status == 1){
            status_text = 'Kommunikation gestört';    
        }
        else if (status == 2){
            status_text = 'Kommunikation war gestört';    
        }
    }
    else if(meldungsart == 'SABOTAGE_ALARM'){
        if(status === 0){
            status_text = 'Keine Sabotage';
        }
        else if(status === 1){
            status_text = 'Sabotage';
        }
        else if(status === 2){
            status_text = 'Sabotage aufgehoben';
        }
    }
    else if(meldungsart == 'ERROR'){
        if((native_type == 'HM-Sec-RHS') || (native_type == 'HM-Sec-RHS-2') || (native_type == 'HM-Sec-SC') || (native_type == 'HM-Sec-SC-2') ||
            (native_type == 'HM-Sec-SCo') || (native_type == 'HM-Sec-MD') || (native_type == 'HM-Sec-MDIR') || (native_type == 'HM-Sec-MDIR-2')){
            if(status == 7){
                status_text = 'Sabotage';
            }
            else {
                status_text = 'ERROR mit dem Wert: ' +status;    
            }
        }
        else if ((native_type=='HM-Sec-Key') || (native_type=='HM-Sec-Key-S') || (native_type=='HM-Sec-Key-O')){
            if(status == 1){
                status_text = 'Einkuppeln fehlgeschlagen';
            }
            else if(status == 2){
                status_text = 'Motorlauf abgebrochen';
            }
            else {
                status_text = 'ERROR mit dem Wert: ' +status;    
            }
        }
        else if (native_type=='HM-CC-VD'){
            if(status == 1){
                status_text = 'Ventil Antrieb blockiert';
            }
            else if(status == 2){
                status_text = 'Ventil nicht montiert';
            }
            else if(status == 3){
                status_text = 'Stellbereich zu klein';
            }
            else if(status == 4){
                status_text = 'Batteriezustand niedrig';
            }
            else {
                status_text = 'ERROR mit dem Wert: ' +status;    
            }    
        }
        else {
            status_text = meldungsart +' mit dem Wert: ' +status;    
        }    
    }
    else if(meldungsart == 'LOWBAT_ALARM' || meldungsart == 'LOW_BAT_ALARM'){
        if(status === 0){
            status_text = 'Batterie ok';
        }
        else if (status == 1){
            status_text = 'Batterie niedrig';    
        }
        else if (status == 2){
            status_text = 'Batterie ok';    
        }
    
    }
    else if(meldungsart == 'ERROR_NON_FLAT_POSITIONING_ALARM'){
        if(status === 0){
            status_text = 'Keine Meldung';
        }
        else if(status === 1){
            status_text = 'Gerät wurde angehoben.';
        }
        else if(status === 2){
            status_text = 'Gerät wurde angehoben. Bestätigt';
        }
        
    }
    else if(meldungsart == 'CONFIG_PENDING_ALARM'){
        if(status === 0){
            status_text = 'keine Meldung';
        }
        else if (status == 1){
            status_text = 'Konfigurationsdaten stehen zur Übertragung an';    
        }
        else if (status == 2){
            status_text = 'Konfigurationsdaten standen zur Übertragung an';    
        }
        
    }
    else if(meldungsart == 'UPDATE_PENDING_ALARM'){
        if(status === 0){
            status_text = 'kein Update verfügbar';
        }
        else if (status == 1){
            status_text = 'Update verfügbar';    
        }
        else if (status == 2){
            status_text = 'Update wurde eingespielt';    
        }    
        
    }
    else if(meldungsart == 'DEVICE_IN_BOOTLOADER_ALARM'){
        if(status === 0){
            status_text = 'Keine Meldung';
        }
        else if(status === 1){
            status_text = 'Gerät startet neu';
        }
        else if(status === 2){
            status_text = 'Gerät wurde neu getsartet';
        }    
    }
    else if(meldungsart == 'FAULT_REPORTING_ALARM'){
        if(native_type == 'HM-CC-RT-DN'){
            if(status === 0){
                status_text = 'keine Störung';
            }
            else if(status == 1){
                status_text = 'Ventil blockiert';    
            }
            else if(status == 2){
                status_text = 'Einstellbereich Ventil zu groß';    
            }
            else if(status == 3){
                status_text = 'Einstellbereich Ventil zu klein';    
            }
            else if(status == 4){
                status_text = 'Kommunikationsfehler';    
            }
            else if(status == 6){
                status_text = 'Spannung Batterien/Akkus gering';    
            }
            else if(status == 7){
                status_text = 'Fehlstellung Ventil';    
            }
            else{
                status_text = meldungsart+' mit dem Wert: ' +status;        
            }
        }
        else{
            status_text = meldungsart+' mit dem Wert: ' +status;    
        }
            
    }  
    return(status_text);
}

function func_get_datum(id){
    let datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
    let datum_seit;
    if(datum < '01.01.71 01:00:00'){
        datum_seit = '';
        
    }else{
        datum_seit=  ' --- seit: ' +datum +' Uhr';
    }
    return(datum_seit);
}

function func_Batterie(native_type){
    let Batterie = 'unbekannt';
    let cr2016 = ['HM-RC-4', 'HM-RC-4-B', 'HM-RC-Key3', 'HM-RC-Key3-B', 'HM-RC-P1', 'HM-RC-Sec3', 'HM-RC-Sec3-B', 'ZEL STG RM HS 4'];
    let cr2032 = ['HM-PB-2-WM', 'HM-PB-4-WM', 'HM-PBI-4-FM', 'HM-SCI-3-FM', 'HM-Sec-TiS', 'HM-SwI-3-FM', 'HmIP-FCI1'];
    let lr14x2 = ['HM-Sec-Sir-WM', 'HM-OU-CFM-TW', 'HM-OU-CFM-Pl'];
    let lr44x2 = ['HM-Sec-SC', 'HM-Sec-SC2L', 'HM-Sec-SC-2', 'HM-Sec-RHS'];
    let lr6x2 = ['HM-CC-VD', 'HM-CC-RT-DN', 'HM-Sec-WDS', 'HM-Sec-WDS-2', 'HM-CC-TC', 'HM-Dis-TD-T', 'HB-UW-Sen-THPL-I', 'HM-WDS40-TH-I', 'HM-WDS40-TH-I-2', 'HM-WDS10-TH-O', 'HmIP-SMI', 'HMIP-eTRV', 'HM-WDS30-OT2-SM-2', 'HmIP-SMO', 'HmIP-SMO-A', 'HmIP-SPI', 'HmIP-eTRV-2', 'HmIP-SPDR', 'HmIP-SWD', 'HmIP-STHO-A', 'HmIP-eTRV-B', 'HmIP-PCBS-BAT','HmIP-STHO'];
    let lr6x3 = ['HmIP-SWO-PL', 'HM-Sec-MDIR', 'HM-Sec-MDIR-2', 'HM-Sec-SD', 'HM-Sec-Key', 'HM-Sec-Key-S', 'HM-Sec-Key-O', 'HM-Sen-Wa-Od', 'HM-Sen-MDIR', 'HM-Sen-MDIR-O', 'HM-Sen-MDIR-O-2', 'HM-WDS100-C6-O', 'HM-WDS100-C6-O-2', 'HM-WDS100-C6-O-2', 'HmIP-ASIR', 'HmIP-SWO-B'];
    let lr6x4 = ['HM-CCU-1', 'HM-ES-TX-WM', 'HM-WDC7000'];
    let lr3x1 = ['HM-RC-4-2', 'HM-RC-4-3', 'HM-RC-Key4-2', 'HM-RC-Key4-3', 'HM-RC-Sec4-2', 'HM-RC-Sec4-3', 'HM-Sec-RHS-2', 'HM-Sec-SCo', 'HmIP-KRC4', 'HmIP-KRCA', 'HmIP-RC8', 'HmIP-SRH', 'HMIP-SWDO', 'HmIP-DBB'];
    let lr3x2 = ['HM-TC-IT-WM-W-EU', 'HM-Dis-WM55', 'HM-Dis-EP-WM55', 'HM-PB-2-WM55', 'HM-PB-2-WM55-2', 'HM-PB-6-WM55', 'HM-PBI-2-FM', 'HM-RC-8', 'HM-Sen-DB-PCB', 'HM-Sen-EP', 'HM-Sen-MDIR-SM', 'HM-Sen-MDIR-WM55', 'HM-WDS30-T-O', 'HM-WDS30-OT2-SM', 'HmIP-STH', 'HmIP-STHD', 'HmIP-WRC2', 'HmIP-WRC6', 'HmIP-WTH', 'HmIP-WTH-2', 'HmIP-SAM', 'HmIP-SLO', 'HMIP-SWDO-I', 'HmIP-FCI6', 'HmIP-SMI55', 'HM-PB-2-FM', 'HmIP-SWDM'];
    let lr3x3 = ['HM-PB-4Dis-WM', 'HM-PB-4Dis-WM-2', 'HM-RC-Dis-H-x-EU', 'HM-Sen-LI-O'];
    let lr3x3a = ['HM-RC-19', 'HM-RC-19-B', 'HM-RC-12', 'HM-RC-12-B', 'HM-RC-12-W'];
    let lr14x3 = ['HmIP-MP3P'];
    let block9 = ['HM-LC-Sw1-Ba-PCB', 'HM-LC-Sw4-PCB', 'HM-MOD-EM-8', 'HM-MOD-Re-8', 'HM-Sen-RD-O', 'HM-OU-CM-PCB', 'HM-LC-Sw4-WM'];
    let fixed    = ['HM-Sec-SD-2', 'HmIP-SWSD'];
    let ohne = ['HM-LC-Sw1PBU-FM', 'HM-LC-Sw1-Pl-DN-R1', 'HM-LC-Sw1-DR', 'HM-LC-RGBW-WM', 'HM-LC-Sw1-Pl-CT-R1', 'HmIP-HEATING', 'HM-LC-Sw1-FM', 'HM-LC-Sw2-FM', 'HM-LC-Sw4-DR', 'HM-LC-Sw1-Pl', 'HM-LC-Sw1-Pl-2', 'HM-LC-Sw4-Ba-PCB', 'HM-LC-Sw1-SM', 'HM-LC-Sw4-SM', 'HM-Sys-sRP-Pl', 'LC-Sw2PBU-FM'];
    let recharge = ['HM-Sec-Win', 'HM-Sec-SFA-SM'];


    for (var i = 0; i < cr2016.length; i++) {
        if (cr2016[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '1x CR2016';
            break;
        }
    }
    for (i = 0; i < cr2032.length; i++) {
        if (cr2032[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '1x CR2032';
            break;
        }
    }
    for (i = 0; i < lr14x2.length; i++) {
        if (lr14x2[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '2x LR14';
            break;
        }
    }
    for (i = 0; i <lr44x2.length; i++) {
        if (lr44x2[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '2x LR44/AG13';
            break;
        }
    }
    for (i = 0; i <lr6x2.length; i++) {
        if (lr6x2[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '2x LR6/AA';
            break;
        }
    }
    for (i = 0; i < lr6x3.length; i++) {
        if (lr6x3[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '3x LR6/AA';
            break;
        }
    }
    for (i = 0; i < lr6x4.length; i++) {
        if (lr6x4[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '4x LR6/AA';
            break;
        }
    }
    for (i = 0; i < lr3x1.length; i++) {
        if (lr3x1[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '1x LR3/AAA';
            break;
        }
    }
    for (i = 0; i < lr3x2.length; i++) {
        if (lr3x2[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '2x LR3/AAA';
            break;
        }
    }
    for (i = 0; i < lr3x3.length; i++) {
        if (lr3x3[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '3x LR3/AAA';
            break;
        }
    }
    for (i = 0; i < lr3x3a.length; i++) {
        if (lr3x3a[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '3x AAA Akkus - bitte laden';
            break;
        }
    }

    for (i = 0; i < lr14x3.length; i++) {
        if (lr14x3[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '3x LR14/C';
            break;
        }
    }

    for (i = 0; i < block9.length; i++) {
        if (block9[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = '9Volt Block leer oder unbestimmt';
            break;
        }
    }
    for (i = 0; i < fixed.length; i++) {
        if (fixed[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = 'Festbatterie leer';
            break;
        }
    }
    for (i = 0; i < ohne.length; i++) {
        if (ohne[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = 'ohne Batterie';
            break;
        }
    }
    for (i = 0; i < recharge.length; i++) {
        if (recharge[i].toUpperCase() == native_type.toUpperCase()) {
            Batterie = 'Akku entladen - bitte aufladen';
            break;
        }
    }

    return(Batterie);
   
}

function func_IST_Gesamt(){
    let IST_LOWBAT = 0;
    let IST_LOW_BAT = 0;
    let IST_UNREACH = 0;
    let IST_STICKY_UNREACH = 0;
    let IST_CONFIG_PENDING = 0;
    let IST_UPDATE_PENDING = 0;
    let IST_DEVICE_IN_BOOTLOADER = 0;
    let IST_ERROR = 0;
    let IST_ERROR_NON_FLAT_POSITIONING = 0;
    let IST_ERROR_CODE = 0;
    let IST_FAULT_REPORTING = 0;
    let IST_SABOTAGE = 0;
    let IST_Gesamt = 0;


    if(write_state){
        if(id_IST_LOWBAT !== ''){
             IST_LOWBAT = parseFloat(getState(id_IST_LOWBAT).val);    
        }
        if(id_IST_LOW_BAT !== ''){
            IST_LOW_BAT = parseFloat(getState(id_IST_LOW_BAT).val);
        }
        if(id_IST_UNREACH !== ''){
            IST_UNREACH = parseFloat(getState(id_IST_UNREACH).val);
        }
        if(id_IST_STICKY_UNREACH !== ''){
            IST_STICKY_UNREACH = parseFloat(getState(id_IST_STICKY_UNREACH).val);
        }
        if(id_IST_CONFIG_PENDING !== ''){
            IST_CONFIG_PENDING = parseFloat(getState(id_IST_CONFIG_PENDING).val);
        }
        if(id_IST_UPDATE_PENDING !== ''){
            IST_UPDATE_PENDING = parseFloat(getState(id_IST_UPDATE_PENDING).val);
        }
        if(id_IST_UPDATE_PENDING !== ''){
            IST_UPDATE_PENDING = parseFloat(getState(id_IST_UPDATE_PENDING).val);
        }
        if(id_IST_DEVICE_IN_BOOTLOADER !== ''){
            IST_DEVICE_IN_BOOTLOADER = parseFloat(getState(id_IST_DEVICE_IN_BOOTLOADER).val);
        }
        if(id_IST_ERROR !== ''){
            IST_ERROR = parseFloat(getState(id_IST_ERROR).val);
        }
        if(id_IST_ERROR_CODE !== ''){
             IST_ERROR_CODE = parseFloat(getState(id_IST_ERROR_CODE).val);
        }
        if(id_IST_FAULT_REPORTING !== ''){
            IST_FAULT_REPORTING = parseFloat(getState(id_IST_FAULT_REPORTING).val);
        }
        if(id_IST_SABOTAGE !== ''){
            IST_SABOTAGE = parseFloat(getState(id_IST_SABOTAGE).val);
        }
        
    
        if(id_IST_Gesamt === ''){
            if(debugging){
                log('Feld id_IST_Gesamt nicht ausgewählt');
            }
        }
        else{
            IST_Gesamt = IST_LOWBAT + IST_LOW_BAT + IST_UNREACH + IST_STICKY_UNREACH + IST_CONFIG_PENDING + IST_UPDATE_PENDING + IST_DEVICE_IN_BOOTLOADER + IST_ERROR + IST_ERROR_CODE + IST_FAULT_REPORTING + IST_SABOTAGE;
            if(debugging){
                log('Derzeitige Servicemeldungen: ' +IST_Gesamt +' --- Ergebnis in Objekt geschrieben');
            }
            setState(id_IST_Gesamt,IST_Gesamt);
        }


    }    
}

function Servicemeldung(obj) {
    var common_name;
    var obj;
    var id_name;
    var native_type; 
    var meldungsart;
    var Gesamt = 0;
    var Gesamt_UNREACH = 0;
    var Gesamt_STICKY_UNREACH = 0;
    var Gesamt_SABOTAGE = 0;
    var Gesamt_ERROR = 0;
    var Gesamt_LOWBAT = 0;
    var Gesamt_LOW_BAT = 0;
    var Gesamt_ERROR_NON_FLAT_POSITIONING = 0;
    var Gesamt_CONFIG_PENDING = 0;
    var Gesamt_UPDATE_PENDING = 0;
    var Gesamt_DEVICE_IN_BOOTLOADER = 0;
    var Gesamt_FAULT_REPORTING = 0;
    var Betroffen = 0;
    var Betroffen_UNREACH = 0;
    var Betroffen_STICKY_UNREACH = 0;
    var Betroffen_SABOTAGE = 0;
    var Betroffen_ERROR = 0;
    var Betroffen_LOWBAT = 0;
    var Betroffen_LOW_BAT = 0;
    var Betroffen_ERROR_NON_FLAT_POSITIONING = 0;
    var Betroffen_CONFIG_PENDING = 0;
    var Betroffen_UPDATE_PENDING = 0;
    var Betroffen_DEVICE_IN_BOOTLOADER = 0;
    var Betroffen_FAULT_REPORTING = 0;
    
    var text      = [];
    var messgae_tmp = '';
    var messgae_tmp1 = '';
    var log_manuell = false;
    
    if (obj) {
        common_name = obj.common.name.substr(0, obj.common.name.indexOf(':'));
        id_name = obj.id.split('.')[2];
        native_type = getObject(obj.id.substring(0, obj.id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = obj.id.split('.')[4];
        var status = obj.newState.val;                                 
        var status_text = func_translate_status(meldungsart, native_type, status);
        
        common_name = replaceAll(common_name, '.', ' ');          // Umwandeln aller "." in Leerzeichen
        common_name = replaceAll(common_name, 'ae', 'ä');         // Sonderzeichen umwandeln für bessere Text- und Sprachausgabe
        common_name = replaceAll(common_name, 'ue', 'ü');
        common_name = replaceAll(common_name, 'oe', 'ö');
        common_name = replaceAll(common_name, 'ss', 'ß');
    
        if(no_observation.search(id_name) == -1){    
            log('Neue Servicemeldung: ' +common_name +' ('+id_name +') --- ' +native_type +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);
        }
        else{
            if(debugging){
                log('[DEBUG] ' +'Neue Servicemeldung außerhalb der Überwachung: ' +common_name +' ('+id_name +') --- ' +native_type +'--- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);    
            }
        }
           
        
    } 
    else {
        if(debugging){
            log('Function wird gestartet.');  
        }
        log_manuell = true;
    }
    
    SelectorLOWBAT.each(function (id, i) {                         // Schleife für jedes gefundenen Element *.LOWBAT
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj    = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        var Batterie = func_Batterie(native_type);    
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_LOWBAT
            text.push(common_name +' ('+id_name +') --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);         // Zu Array hinzufügen
            messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie;
            messgae_tmp1 = common_name +' ('+id_name +')' + ' - Spannung Batterien/Akkus gering. '+Batterie;
            if(with_time && datum_seit !== ''){
                messgae_tmp = messgae_tmp +datum_seit;
                messgae_tmp1 = messgae_tmp1 +datum_seit;
            }
           
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_LOWBAT
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +' --- ' +Batterie);
        }
        //wenn Batterie unbekannt dann Log
        if(Batterie == 'unbekannt' && native_type !==''){
            log('Bitte melden: ' + common_name +' ('+id_name+') --- '+native_type +' --- Batterietyp fehlt im Script');
        }
        
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_LOWBAT === 0){
        if(debugging || log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt LOWBAT.');
        }
    }
    else{
        if(Betroffen_LOWBAT > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_LOWBAT +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_LOWBAT +' Servicemeldung(en).');    
            }
        }
        else{
            if((debugging) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_LOWBAT +' Geräte mit dem Datenpunkt LOWBAT.');
            
            }    
        }
    }
    
        SelectorLOW_BAT.each(function (id, i) {                         // Schleife für jedes gefundenen Element 
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        var Batterie = func_Batterie(native_type);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_LOW_BAT
            text.push(common_name +' ('+id_name +') --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);         // Zu Array hinzufügen
            messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Spannung Batterien/Akkus gering.</font> '+Batterie;
            messgae_tmp1 = common_name +' ('+id_name +')' + ' - Spannung Batterien/Akkus gering. '+Batterie;
            if(with_time && datum_seit !== ''){
                messgae_tmp = messgae_tmp +datum_seit;
                messgae_tmp1 = messgae_tmp1 +datum_seit;
            }
           
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_LOW_BAT
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit +' --- ' +Batterie);
        }
        //wenn Batterie unbekannt dann Log
        if(Batterie == 'unbekannt' && native_type !==''){
            log('Bitte melden: ' + common_name +' ('+id_name+') --- '+native_type +' --- Batterietyp fehlt im Script');
        }
        
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_LOW_BAT === 0){
        if(debugging || log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt LOWBAT.');
        }
    }
    else{
        if(Betroffen_LOW_BAT > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_LOW_BAT +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_LOW_BAT +' Servicemeldung(en).');    
            }
        }
        else{
            if((debugging) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_LOW_BAT +' Geräte mit dem Datenpunkt LOW_BAT.');
            
            }    
        }
    }
    
    SelectorUNREACH.each(function (id, i) {                         // Schleife für jedes gefundenen Element
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1) {      
            ++Betroffen;
            ++Betroffen_UNREACH;
            text.push(common_name +' ('+id_name +') --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);         // Zu Array hinzufügen
            messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Kommunikation gestört.</font> '+'\n';
            messgae_tmp1 = common_name +' ('+id_name +')' + ' - Kommunikation gestört.';
            if(with_time && datum_seit !== ''){
                messgae_tmp = messgae_tmp +datum_seit;
                messgae_tmp1 = messgae_tmp1 +datum_seit;
            }
           
        }  
        ++Gesamt;       // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_UNREACH;
        
        if(debugging){
            log('Geräte Nr. ' +(i + 1)  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    });
    
    // Schleife ist durchlaufen. 
    if(Gesamt_UNREACH === 0){
        if(debugging || log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt UNREACH.');
        }
    }
    else{
        if(Betroffen_UNREACH > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_UNREACH +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_UNREACH +' Servicemeldung(en).');    
            }
        }
        else{
            if((debugging) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_UNREACH +' Geräte mit dem Datenpunkt UNREACH.');
            
            }    
        }
    }
    
    SelectorSTICKY_UNREACH.each(function (id, i) {  
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_STICKY_UNREACH;
            text.push(common_name +' ('+id_name +') --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);         // Zu Array hinzufügen
            if(autoAck){
                setStateDelayed(id,2,5000);
                messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Meldung über bestätigbare Kommunikationsstörung gelöscht.</font> '+'\n';
                messgae_tmp1 = common_name +' ('+id_name +')' + ' - Meldung über bestätigbare Kommunikationsstörung gelöscht. ';
                if(with_time && datum_seit !== ''){
                    messgae_tmp = messgae_tmp +datum_seit;
                    messgae_tmp1 = messgae_tmp1 +datum_seit;
                }
            }
            else {
                messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">bestätigbare Kommunikationsstörung.</font>';    
                messgae_tmp1 = common_name +' ('+id_name +')' + ' - bestätigbare Kommunikationsstörung.'; 
                if(with_time && datum_seit !== ''){
                    messgae_tmp = messgae_tmp +datum_seit;
                    messgae_tmp1 = messgae_tmp1 +datum_seit;
                }
            }
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_STICKY_UNREACH;
        
        if(debugging){
            log('Geräte Nr. ' +(i + 1)  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 

    // Schleife ist durchlaufen. 
    if(Gesamt_STICKY_UNREACH === 0){
        if(debugging || log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt STICKY_UNREACH.');
        }
    }
    else{
        if(Betroffen_STICKY_UNREACH > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_STICKY_UNREACH +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_STICKY_UNREACH +' Servicemeldung(en).');    
            }
        }
        else{
            if((debugging) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_STICKY_UNREACH +' Geräte mit dem Datenpunkt STICKY_UNREACH.');
            
            }    
        }
    }
    
    SelectorSABOTAGE.each(function (id, i) {                         
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj    = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1) {      
            ++Betroffen;
            ++Betroffen_SABOTAGE;
            text.push(common_name +' ('+id_name +') --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);         // Zu Array hinzufügen
            messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> '+'\n';
            messgae_tmp1 = common_name +' ('+id_name +')' + ' - ' +status_text +'.';
            if(with_time && datum_seit !== ''){
                messgae_tmp = messgae_tmp +datum_seit;
                messgae_tmp1 = messgae_tmp1 +datum_seit;
            }
        
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_SABOTAGE;
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_SABOTAGE === 0){
        if(debugging || log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt SABOTAGE.');
        }
    }
    else{
        if(Betroffen_SABOTAGE > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_SABOTAGE +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_SABOTAGE +' Servicemeldung(en).');    
            }
        }
        else{
            if((debugging) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_SABOTAGE +' Geräte mit dem Datenpunkt SABOTAGE.');
            
            }    
        }
    }
    
    SelectorERROR.each(function (id, i) {
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status > 0) {      // wenn Zustand größer 0, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_ERROR;
            text.push(common_name +' ('+id_name +') --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);         // Zu Array hinzufügen
            messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">'+status_text +'.</font> '+'\n';
            messgae_tmp1 = common_name +' ('+id_name +')' + ' - '+status_text;
            if(with_time && datum_seit !== ''){
                messgae_tmp = messgae_tmp +datum_seit;
                messgae_tmp1 = messgae_tmp1 +datum_seit;
            }
        
        }  
        ++Gesamt;           // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_ERROR
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_ERROR === 0){
        if(debugging || log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt ERROR.');
        }
    }
    else{
        if(Betroffen_ERROR > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_ERROR +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_ERROR +' Servicemeldung(en).');    
            }
        }
        else{
            if((debugging) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_ERROR +' Geräte mit dem Datenpunkt ERROR.');
            
            }    
        }
    }
    
    SelectorERROR_NON_FLAT_POSITIONING.each(function (id, i) { 
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_ERROR_NON_FLAT_POSITIONING
             text.push(common_name +' ('+id_name +') --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);         // Zu Array hinzufügen
            messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">wurde angehoben.</font> '+'\n';
            messgae_tmp1 = common_name +' ('+id_name +')' + ' - wurde angehoben.';
            if(with_time && datum_seit !== ''){
                messgae_tmp = messgae_tmp +datum_seit;
                messgae_tmp1 = messgae_tmp1 +datum_seit;
            }
        
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_ERROR_NON_FLAT_POSITIONING
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    });
    
    // Schleife ist durchlaufen. 
    if(Gesamt_ERROR_NON_FLAT_POSITIONING === 0){
        if(debugging || log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt ERROR_NON_FLAT_POSITIONING.');
        }
    }
    else{
        if(Betroffen_ERROR_NON_FLAT_POSITIONING > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_ERROR_NON_FLAT_POSITIONING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_ERROR_NON_FLAT_POSITIONING +' Servicemeldung(en).');    
            }
        }
        else{
            if((debugging) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_ERROR_NON_FLAT_POSITIONING +' Geräte mit dem Datenpunkt ERROR_NON_FLAT_POSITIONING.');
            
            }    
        }
    }
    
    SelectorFAULT_REPORTING.each(function (id, i) {                        
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj    = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        var Batterie = func_Batterie(native_type);    
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status > 0) {      // wenn Zustand größer 0, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_FAULT_REPORTING;
            text.push(common_name +' ('+id_name +') --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);                            // Zu Array hinzufügen
            messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">' +status_text +'.</font> '+'\n';
            messgae_tmp1 = common_name +' ('+id_name +')' + ' - ' +status_text +'.';
            if(with_time && datum_seit !== ''){
                messgae_tmp = messgae_tmp +datum_seit;
                messgae_tmp1 = messgae_tmp1 +datum_seit;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_FAULT_REPORTING;
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_FAULT_REPORTING === 0){
        if(debugging || log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt FAULT_REPORTING.');
        }
    }
    else{
        if(Betroffen_FAULT_REPORTING > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_FAULT_REPORTING +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_FAULT_REPORTING +' Servicemeldung(en).');    
            }
        }
        else{
            if((debugging) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_FAULT_REPORTING +' Geräte mit dem Datenpunkt FAULT_REPORTING.');
            
            }    
        }
    }
    
    SelectorDEVICE_IN_BOOTLOADER.each(function (id, i) {                         
        common_name = getObject(id.substring(0, id.lastIndexOf('.') - 2)).common.name;
        id_name = id.split('.')[2];
        obj = getObject(id);
        native_type = getObject(id.substring(0, id.lastIndexOf('.') - 2)).native.TYPE;
        meldungsart = id.split('.')[4];
        var status = getState(id).val;                                  
        var status_text = func_translate_status(meldungsart, native_type, status);
        var Batterie = func_Batterie(native_type);    
        //var datum = formatDate(getState(id).lc, "TT.MM.JJ SS:mm:ss");
        var datum_seit = func_get_datum(id);
        
        if (status === 1) {      // wenn Zustand = true, dann wird die Anzahl der Geräte hochgezählt
            ++Betroffen;
            ++Betroffen_DEVICE_IN_BOOTLOADER
            text.push(common_name +' ('+id_name +') --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text);     // Zu Array hinzufügen
            messgae_tmp = common_name +' ('+id_name +')' + ' - <font color="red">Gerät startet neu.</font> '+'\n';
            messgae_tmp1 = common_name +' ('+id_name +')' + ' - Gerät startet neu.';
            if(with_time && datum_seit !== ''){
                messgae_tmp = messgae_tmp +datum_seit;
                messgae_tmp1 = messgae_tmp1 +datum_seit;
            }
           
         
        }  
        ++Gesamt;                                        // Zählt die Anzahl der vorhandenen Geräte unabhängig vom Status
        ++Gesamt_DEVICE_IN_BOOTLOADER
        if(debugging){
            log('Geräte Nr. ' +i  +' Name: '+ common_name +' ('+id_name+') --- '+native_type +' --- Typ: '+meldungsart +' --- Status: ' +status +' ' +status_text +datum_seit);
        }
                                                     
    }); 
    
    // Schleife ist durchlaufen. 
    if(Gesamt_DEVICE_IN_BOOTLOADER === 0){
        if(debugging || log_manuell){
            log('Keine Geräte gefunden mit dem Datenpunkt DEVICE_IN_BOOTLOADER.');
        }
    }
    else{
        if(Betroffen_DEVICE_IN_BOOTLOADER > 0){
            if(debugging || log_manuell){
                log('Es gibt: '+Gesamt_DEVICE_IN_BOOTLOADER +' Geräte mit dem Datenpunkt ' +meldungsart+'. Derzeit: '+Betroffen_DEVICE_IN_BOOTLOADER +' Servicemeldung(en).');    
            }
        }
        else{
            if((debugging) || (onetime && log_manuell)){
                log('Es gibt: '+Gesamt_DEVICE_IN_BOOTLOADER +' Geräte mit dem Datenpunkt DEVICE_IN_BOOTLOADER.');
            
            }    
        }
    }
    
    //Verarbeitung aller Datenpunkte        
    if(Betroffen > 0 && native_type !=='HmIP-HEATING'){
        if(debugging || log_manuell){
           log('Es werden: '+Gesamt +' Datenpunkte überwacht. Derzeit: '+Betroffen +' Servicemeldung(en).');
        }
        if(Betroffen == 1){
            if(debugging){
                log('Es gibt eine Servicemeldung: ' + text.join(', '));
            }   
        }
        if(Betroffen >1){
            if(logging){
                log('Übersicht aller Servicemeldungen: '+ text.join(', '));
            }   
        }
        //Push verschicken
        if(no_observation.search(id_name) == -1){
            if(sendpush && !log_manuell){
                prio = 0; 
                titel = 'Servicemeldung';
                message = text.join(', ');
                send_pushover(device, message, titel, prio);
            }
            if(sendtelegram && !log_manuell){
                message = text.join(', ');
                send_telegram(message, user_telegram);
            }
            if(sendmail && !log_manuell){
                message = text.join(', ');
                send_mail(message);
            }
        }
        
    }
    else{
        if((debugging) || (onetime && log_manuell)){
            log(+Gesamt +' Datenpunkte werden insgesamt vom Script ' +name +' (Version: '+Version +') überwacht. Instance: '+instance);
            
            
        }
        
    }
    
 
}

//Auslösen durch Zustandsänderung
if(observation){
    SelectorUNREACH.on(function(obj) {   
        Servicemeldung(obj);
    });
    SelectorSTICKY_UNREACH.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorSABOTAGE.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorERROR.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorLOWBAT.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorLOW_BAT.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorERROR_NON_FLAT_POSITIONING.on(function(obj) {    
        Servicemeldung(obj);
    });
    SelectorFAULT_REPORTING.on(function(obj) {    
        Servicemeldung(obj);
    });
    
}


if(onetime){
    //beim Start
    Servicemeldung();
    
} 
