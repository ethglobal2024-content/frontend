import React, { useState, useEffect } from "react";
import { init, useQuery } from "@airstack/airstack-react";
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react'
import "./App.css";
import { callStartChat } from "./Web3Modal";

// Initialize Airstack with the API key from .env
const apiKey = process.env.REACT_APP_AIRSTACK_API_KEY;
if (!apiKey) {
  throw new Error("REACT_APP_AIRSTACK_API_KEY is not set in .env file");
}
init(apiKey);

const App: React.FC = () => {
  const [fname, setFname] = useState<string>("");
  const [queryFname, setQueryFname] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [formattedData, setFormattedData] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<{ overall: string; details: string } | null>(null);
  const [isWaitingForAI, setIsWaitingForAI] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();

  const query = `
    query MyQuery {
      Socials(
        input: {
          filter: { dappName: { _eq: farcaster }, identity: { _eq: "fc_fname:${queryFname}" } }
          blockchain: ethereum
        }
      ) {
        Social {
          profileName
          followerCount
          followingCount
          farcasterScore {
            farScore
          }
        }
      }
      FarcasterCasts(
        input: {
          blockchain: ALL,
          filter: { castedBy: { _eq: "fc_fname:${queryFname}" } },
          limit: 5
        }
      ) {
        Cast {
          text
          hash
        }
      }
    }
  `;

  const { data, loading, error } = useQuery(query, {
    skip: !queryFname,
  });

  useEffect(() => {
    if (data?.Socials?.Social && data.Socials.Social.length > 0 && data.FarcasterCasts?.Cast) {
      const social = data.Socials.Social[0];
      const casts = data.FarcasterCasts.Cast;

      const formattedString = `User Metrics:
Following: ${social.followingCount}
Followers: ${social.followerCount}
FarScore: ${social.farcasterScore?.farScore || 'N/A'}
User Messages: ${casts.slice(0, 5).map((cast: { text: string }) => cast.text).join('***')}`;

      setFormattedData(formattedString);
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryFname(fname);
    setHasSubmitted(true);
    setAiResponse(null);
    setShowDetails(false);
  };

  const handleCheckUser = async () => {
    if (!formattedData) return;

    const web3ModalState = { isConnected, walletProvider, open };
    try {
      setIsWaitingForAI(true);
      const response = await callStartChat(formattedData, web3ModalState);
      if (response && response.content) {
        const parts = response.content.split("Overall Assessment:");
        if (parts.length > 1) {
          setAiResponse({
            overall: parts[1].trim(),
            details: parts[0].trim()
          });
        } else {
          setAiResponse({
            overall: "No overall assessment provided.",
            details: response.content.trim()
          });
        }
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setIsWaitingForAI(false);
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Farcaster Content Cop</h1>
      </header>
      <main>
        <div className="search-container">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              placeholder="Enter Farcaster name"
            />
            <button type="submit">Search</button>
          </form>
          <button onClick={() => open()} className="connect-wallet-button" type="button">
            {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p>Error: {error.message}</p>}

        {hasSubmitted && data && (
          <div>
            {data.Socials?.Social && data.Socials.Social.length > 0 ? (
              <div>
                <h2 className="profile-name">{data.Socials.Social[0].profileName}</h2>
                <div className="profile-info">
                  <div className="info-item">
                    <span className="info-label">Far Score</span>
                    <span className="info-value">{data.Socials.Social[0].farcasterScore?.farScore || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Followers</span>
                    <span className="info-value">{data.Socials.Social[0].followerCount}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Following</span>
                    <span className="info-value">{data.Socials.Social[0].followingCount}</span>
                  </div>
                </div>
                <button onClick={handleCheckUser} className="check-user-button" type="button">Check User</button>
                <div className="faucet-link">
                  <a href="https://docs.galadriel.com/faucet" target="_blank" rel="noopener noreferrer">GAL Faucet</a>
                </div>
              </div>
            ) : (
              <p>No profile information found.</p>
            )}

            {!aiResponse && !isWaitingForAI && data.FarcasterCasts?.Cast && data.FarcasterCasts.Cast.length > 0 && (
              <div>
                <h3 className="casts-title">5 Latest Casts</h3>
                <ul>
                  {data.FarcasterCasts.Cast.map((cast: { text: string; hash: string }) => (
                    <li key={cast.hash}>{cast.text}</li>
                  ))}
                </ul>
              </div>
            )}

            {isWaitingForAI && (
              <div className="loading-indicator">
                <p>Waiting for AI response...</p>
              </div>
            )}

    {aiResponse && (
      <div className="ai-response">
        <h2>Galardriel AI Response</h2>
        <div className="overall-assessment">
          <h2>Overall Assessment</h2>
          {aiResponse.overall.split('\n').map((line, index) => {
            if (line.startsWith('Potential Spam:')) {
              return (
                <React.Fragment key={index}>
                  <h3>Potential Spam:</h3>
                  <p>{line.substring('Potential Spam:'.length).trim()}</p>
                </React.Fragment>
              );
            } else if (line.startsWith('Ethical Concerns:')) {
              return (
                <React.Fragment key={index}>
                  <h3>Ethical Concerns:</h3>
                  <p>{line.substring('Ethical Concerns:'.length).trim()}</p>
                </React.Fragment>
              );
            } else if (line.startsWith('Recommended Action:')) {
              return (
                <React.Fragment key={index}>
                  <h3>Recommended Action:</h3>
                  <p>{line.substring('Recommended Action:'.length).trim()}</p>
                </React.Fragment>
              );
            } else {
              return <p key={index}>{line}</p>;
            }
          })}
        </div>
        <button onClick={toggleDetails} className="toggle-details-button">
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
        {showDetails && (
          <div className="response-details">
            <h2>Details:</h2>
            {aiResponse.details.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;