const axios = require("axios");
const { exec } = require('child_process');
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLSchema,
} = require('graphql');

const baseUrl = "https://your freepbx server ip";   // enter address of your hosted server 
const clientId = "client id";  // generate client id from freepbx (steps are defined in readme file)
const clientSecret = "client secret";  //Ngenerate client secret from freepbx (steps are defined in readme file)
var Extensions = [];


//////////////////////////// sip reload and  console reload functions to execute ////////////////////

// for server connectivity check
// const executeSSHCommand = (command) => {
//   const password = "";
//   const sshCommand = `ssh user@ip '${command}'`; // define ip in which server is rnning and a password

//   return new Promise((resolve, reject) => {
//     exec(sshCommand, (error, stdout, stderr) => {
//       if (error) {
//         console.error(`SSH Command Error for '${command}':`, error);
//         console.error('stderr:', stderr);
//         reject(error);
//         return;
//       }
//       resolve(stdout);
//     });
//   });
// };

// const reloadSIPCommand = () => {
//   return executeSSHCommand('asterisk -rx "sip reload"');
// };

// const reloadFreePBXCommand = () => {
//   return executeSSHCommand('fwconsole reload');
// };

////////////////////////////////// sip & console reload function //////////////////////////


// different functions to create extensions using gql

const ExtensionType = new GraphQLObjectType({
  name: 'Extension',
  fields: () => ({
    status: { type: GraphQLBoolean },
    message: { type: GraphQLString },
    extensionId: { type: GraphQLString },
    name: { type: GraphQLString },
    tech: { type: GraphQLString },
  }),
});

const RootMutation = new GraphQLObjectType({
  name: 'RootMutationType',
  fields: {
    addExtension: {
      type: ExtensionType,
      args: {
        input: {
          type: new GraphQLObjectType({
            name: 'addExtensionInput',
            fields: () => ({
              extensionId: { type: GraphQLString },
              name: { type: GraphQLString },
              tech: { type: GraphQLString },
              channelName: { type: GraphQLString },
              outboundCid: { type: GraphQLString },
              email: { type: GraphQLString },
              umEnable: { type: GraphQLBoolean },
              umPassword: { type: GraphQLString },
              vmEnable: { type: GraphQLBoolean },
              vmPassword: { type: GraphQLString },
              callerID: { type: GraphQLString },
              emergencyCid: { type: GraphQLString },
            }),
          }),
        },
      },
      resolve(parent, args) {
        return addExtensionToSystem(args.input);
      },
    },
  },
});

// after generating access tokens , we are sending a request using axios with access token for connection with freepbx gql
async function getAccessToken() {
  try {
    const response = await axios.post(
      baseUrl,
      {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }
    );

    return response.data.access_token;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
}

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {

    placeholder: {
      type: GraphQLString,
      resolve: () => "This is a placeholder query.",
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: RootMutation,
});

async function fetchData() {
  const accessToken = await getAccessToken();
  const graphqlEndpoint = "https://freepbx.com/api/gql";  // your freepbx server endpoint , it will be gerated there 
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      contentType: "application/json",
    },
  };


  const userInputForAdd = {
    extensionId: "0000",
    name: "test extension 0 ",
    tech: "pjsip",
    channelName: "freepbx@gql",
    outboundCid: "0000",
    email: "0000@gmailcom",
    umEnable: false,
    vmEnable: false,
    umPassword: "0000",
    vmPassword: "0000",
    callerID: "0000",
    emergencyCid: "0000",
  };

  await addExtensionToSystem(userInputForAdd, config);
}

async function addExtensionToSystem(input, config) {
  const graphqlEndpoint = "https://freepbx.com/admin/api/api/gql";

  try {
    const response = await axios.post(
      graphqlEndpoint,
      {
        query: `
                mutation ($input: addExtensionInput!) {
                  addExtension(input: $input) {
                    status
                    message
                  }
                }
              `,
        variables: {
          input: {
            extensionId: input.extensionId,
            name: input.name,
            tech: input.tech,
            channelName: input.channelName,
            outboundCid: input.outboundCid,
            email: input.email,
            umGroups: input.umGroups,
            umEnable: input.umEnable,
            umPassword: input.umPassword,
            vmPassword: input.vmPassword,
            vmEnable: input.vmEnable,
            callerID: input.callerID,
            emergencyCid: input.emergencyCid,
            clientMutationId: input.clientMutationId,
          },
        },
      },
      config
    );

    console.log(response.data);
  } catch (error) {
    console.error("Error:", error.response ? error.response.data : error.message);
  } finally {
    process.exit(0);
  }
}

//fetchData();

// async function for reloading both & fetchdata

async function main() {
  try {
    //await reloadSIPCommand();
    //await reloadFreePBXCommand();
    await fetchData();
  } catch (error) {
    console.error('Main Error:', error);
  }
}

main();