const { exec } = require("child_process");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("./key.json");
const fs = require('fs');
require("dotenv").config();

const saveError = (erro) => {
  const file = {
    titulo: `Sem internet, horario: ${response.result.horario}`,
    erro,

  }
  fs.appendFile(`logs/${response.result.date.replace('/','').replace('/','')}.json`, JSON.stringify(file, null, 2), (err) => {
    if (err) {
      console.log(err)
    }
  })
}
const doc = new GoogleSpreadsheet(process.env.SHEETID);
const errorString = "already exists. Please enter another name.";
let response = {
  date: "",
  result: {
    ping: 0,
    download: 0,
    upload: 0,
    horario: "",
  },
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))


const sheetManagement = async (response) => {
  try {
  await doc.useServiceAccountAuth(
    creds,
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  );
  await doc.loadInfo(); // loads document properties and worksheets
  }catch (error){
    saveError(error)
  }
  try {
    await doc.addSheet({
      title: response.date,
      headerValues: ["Horário", "Ping", "Download", "Upload"],
    });
  } catch (error) {
    if (error?.response?.data?.error?.message?.includes(errorString)) {
      const sheet = doc.sheetsByTitle[response.date];
      await sheet.addRow({
        Horário: response.result.horario,
        Ping: response.result.ping,
        Download: response.result.download,
        Upload: response.result.upload,
      });
    }
  }
};

const speedTest = async () => {
    exec("speedtest-cli --json", (err, stdout, stderr) => {
    if (err || stderr) {
      saveError(err)
    } else {
      const { ping, download, upload } = JSON.parse(stdout);
      response.result.ping = ping.toFixed(2).toString() + " ms";
      response.result.download =
        (download).toFixed(2).toString() + " Mb/s";
      response.result.upload =
        (upload).toFixed(2).toString() + " Mb/s";
      sheetManagement(response);
    }
  });
}

const main = async () => {
  while (true) {
    response.result.date = new Date().toLocaleDateString();
    response.result.horario = new Date().toLocaleTimeString();
    await speedTest()
    await delay((1000 * 60)/ process.env.SCANSPERMINUTE)
  }
}

main()