import type React from "react";
import { useState, useEffect } from "react";
import { init, useQuery } from "@airstack/airstack-react";
import { useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react'
import "./App.css";

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
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();

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
        }
      }
    }
  `;

  const { data, loading, error } = useQuery(query, {
    skip: !queryFname,
  });

  useEffect(() => {
    if (data?.Socials?.Social && data.Socials.Social.length > 0) {
      const socialData = data.Socials.Social[0];
      // Handle socialData as needed
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryFname(fname);
    setHasSubmitted(true);
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
      </div>
    ) : (
      <p>No profile information found.</p>
    )}

    {data.FarcasterCasts?.Cast && data.FarcasterCasts.Cast.length > 0 ? (
      <div>
        <h3 className="casts-title">5 Latest Casts</h3>
        <ul>
          {data.FarcasterCasts.Cast.map((cast: { text: string, hash: string }) => (
            <li key={cast.hash}>{cast.text}</li>
          ))}
        </ul>
      </div>
    ) : (
      <p>No recent casts found.</p>
    )}
  </div>
)}
      </main>
    </div>
  );
};

export default App;