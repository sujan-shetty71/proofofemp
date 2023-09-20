const express = require('express');
const {auth, resolver, loaders} = require('@iden3/js-iden3-auth');
const getRawBody = require('raw-body')
const { v4: uuidv4 } = require('uuid');
var pool = require('./database');
let auth12=null;
const app = express();
const port = 8080;

app.use(express.static('static'));

app.get("/api/sign-in", (req, res) => {
    console.log('get Auth Request');
    GetAuthRequest(req,res);
});

app.post("/api/callback", (req, res) => {
    console.log('callback');
	// console.log('requestsss',req);
    Callback(req,res);
});

app.get("/api/callbackstatus", (req, res) => {
    const xId = req.header('x-id');
    if (!xId) {
        return res.status(400).json({ error: "x-id header is missing" });
    }

    pool.query('SELECT * FROM authinfo WHERE sid = ?', [xId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        if (results.length > 0) {
            const userId = xId;
            return res.status(200).json({ userId });
        } else {
            res.status(400).json({ error: "User not authenticated yet" });
        }
    });
});

app.listen(port, () => {
    console.log('server running on port 8080');
});

// Create a map to store the auth requests and their session IDs
const requestMap = new Map();

		// GetQR returns auth request
		async function GetAuthRequest(req,res) {

			// Audience is verifier id
			const hostUrl = "https://9fbd-49-207-247-33.ngrok-free.app";
			const sessionId = uuidv4();
			const callbackURL = "/api/callback"
			const audience = "did:polygonid:polygon:mumbai:2qDyy1kEo2AYcP3RT4XGea7BtxsY285szg6yP9SPrs"

			const uri = `${hostUrl}${callbackURL}?sessionId=${sessionId}`;
             console.log('uuid',sessionId);
			// Generate request for basic authentication
			const request = auth.createAuthorizationRequest(
				'test flow',
				audience,
				uri,
			);
			
			request.id = sessionId;
			request.thid = sessionId;

			// Add request for a specific proof
			const proofRequest = {
				id: 1,
				circuitId: 'credentialAtomicQuerySigV2',
				query: {
				  allowedIssuers: ['*'],
				  type: 'ProofOfEmployee',
				  context: 'https://raw.githubusercontent.com/vinodmalali/custom-schema-emp/main/proof-of-employee.jsonld',
				  credentialSubject: {
					isEmployee: {
					  $eq: 1,
					},
				  },
			  },
			  };
			const scope = request.body.scope ?? [];
			request.body.scope = [...scope, proofRequest];
			 
			// Store auth request in map associated with session ID
			requestMap.set(`${sessionId}`, request);

			return res.status(200).set('Content-Type', 'application/json').send(request);
        }

        // Callback verifies the proof after sign-in callbacks
		async function Callback(req,res) {
			
			// Get session ID from request
			const sessionId = req.query.sessionId;
			// get JWZ token params from the post requestcons
			console.log('session',sessionId);
			const raw = await getRawBody(req);
			const tokenStr = raw.toString().trim();

			const ethURL = 'https://polygon-mumbai.g.alchemy.com/v2/mnf7uPHdmWbHTx2RfZWTFQbmUZk6QeAW';
			const contractAddress = "0x134B1BE34911E39A8397ec6289782989729807a4"
			const keyDIR = "../keys"

			const ethStateResolver = new resolver.EthStateResolver(
				ethURL,
				contractAddress,
			  );

			const resolvers = {
				['polygon:mumbai']: ethStateResolver,
			};
							 

			// fetch authRequest from sessionID
			const authRequest = requestMap.get(`${sessionId}`);
				
			// Locate the directory that contains circuit's verification keys
			const verificationKeyloader = new loaders.FSKeyLoader("../keys");
			const sLoader = new loaders.UniversalSchemaLoader('ipfs.io');

			// EXECUTE VERIFICATION
			const verifier = new auth.Verifier(
			verificationKeyloader,
			sLoader,
			resolvers,
			);


			try {
				const opts = {
					AcceptedStateTransitionDelay: 5 * 60 * 1000, // 5 minutes
				};
		
				authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);
				const authenticatedUserId = authResponse.thid;
				const did = authResponse.from;
				auth12=did;
		
				// Insert the data into the database
				const insertQuery = "INSERT INTO authinfo (did, sid) VALUES (?, ?)";
				const values = [did, authenticatedUserId];
				pool.query(insertQuery, values, (error, results) => {
					if (error) {
						console.error("Error inserting data into the database:", error);
						return res.status(500).send(error);
					}
		
					console.log("Data inserted into the database:");
		
					return res.status(200).set('Content-Type', 'application/json').send("User with ID: " + did + " successfully authenticated");
				});
			} catch (error) {
				return res.status(500).send(error);
			}
		}
		
		
		
		