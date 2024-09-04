import type React from "react";
import { useState } from "react";
import { init, useQuery } from "@airstack/airstack-react";
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

  const handleFnameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFname(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fname) {
      setQueryFname(fname);
      setHasSubmitted(true);
    }
  };

  return (
    <div className="App">
      <h1>Farcaster Profile and Recent Casts</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={fname}
          onChange={handleFnameChange}
          placeholder="Enter Farcaster name (e.g., vitalik.eth)"
        />
        <button type="submit">Get Info</button>
      </form>

      {hasSubmitted && (
        <>
          {loading && <p>Loading...</p>}
          {error && <p>Error: {error.message}</p>}
          {data?.Socials?.Social &&
          data.Socials.Social.length > 0 ? (
            <div>
              <h2>{data.Socials.Social[0].profileName}</h2>
              <div className="profile-info">
                <p>
                  <span className="info-label">Far Score:</span>{" "}
                  <span className="info-value">
                    {data.Socials.Social[0].farcasterScore.farScore}
                  </span>
                </p>
                <p>
                  <span className="info-label">Followers:</span>{" "}
                  <span className="info-value">
                    {data.Socials.Social[0].followerCount}
                  </span>
                </p>
                <p>
                  <span className="info-label">Following:</span>{" "}
                  <span className="info-value">
                    {data.Socials.Social[0].followingCount}
                  </span>
                </p>
              </div>

              <h3>5 Latest Casts</h3>
              {data.FarcasterCasts?.Cast &&
              data.FarcasterCasts.Cast.length > 0 ? (
                <ul>
                  {data.FarcasterCasts.Cast.map((cast: { text: string }, index: number) => (
                    <li key={`cast-${cast.text.substring(0, 10)}-${index}`}>{cast.text}</li>
                  ))}
                </ul>
              ) : (
                <p>No recent casts found.</p>
              )}
            </div>
          ) : (
            !loading && <p>No data found for {queryFname}</p>
          )}
        </>
      )}
    </div>
  );
};

export default App;
