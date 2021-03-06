const SerialPort = require("serialport");
const mapper = {
  "/dev/ttyUSB0": "CNCA0",
  "/dev/ttyUSB1": "CNCA1",
  "/dev/ttyUSB2": "CNCA2"
};
let portRefMapper = {};

const client = require("socket.io-client")("http://10.1.10.48:8000", {
  path: "/data"
});
client.on("connect", function() {
  console.log(`${new Date()}::Connnected With the Server`);
});
client.on("disconnect", function() {
  console.log(`${new Date()}::Client Disconnected`);
  Object.keys(portRefMapper).map(portName => {
    if (portRefMapper[portName].isOpen) {
      portRefMapper[portName].close();
    }
    client.off(portName);
  });
});

client.on("Connection-List", function(data) {
  console.log(`${new Date()}::Port Info recieved:${JSON.stringify(data)}`);
  if (mapper[data]) {
    console.log(
      `${new Date()}::Port Mapped to Virtual Port:${JSON.stringify(
        mapper[data]
      )}`
    );
    let portRef = getPortObj(mapper[data]);
    portRefMapper[data] = portRef;
    portErrorListner(portRef);
  } else {
    console.log(
      `${new Date()}::Port Mapping Not Found:${JSON.stringify(data)}`
    );
  }

  client.on(data, function(portData) {
    // console.log(
    //   `${new Date()}::Port Data recieved:${JSON.stringify(portData.toString())}`
    // );
    writeData(portRefMapper[data], portData);
  });
});

client.on("connect_error", () => {
  console.log(`${new Date()}::Server Unavailable`);
});

const getPortObj = portName => {
  let virtualPortRef = new SerialPort(portName);
  return virtualPortRef;
};

const writeData = (portName, dataBuffer) => {
  portName.write(dataBuffer, err => {
    if (err) {
      console.log(`${new Date()}::Error Occured While Writing Data to Port`);
    }
  });
};

const portErrorListner = portName => {
  portName.on("error", err => {
    console.log(`${new Date()}::Virtual Port Errored ::${err}`);
    process.exit(1);
  });
};
