const client_id = '6db7f4cebc204871a361900787e82165';
const redirect_uri = 'http://localhost:3000';
const authorizationUrl = `https://accounts.spotify.com/authorize?client_id=${client_id}` +
  `&redirect_uri=${redirect_uri}&scope=playlist-modify-public&response_type=token`;
let currentAccessToken = '';
let expirationTimeInSeconds = 0;

const Spotify = {
  getAccessToken: function() {
    if (currentAccessToken) {
      console.log('Access token already exists: ' + currentAccessToken);
      return currentAccessToken;
    };
    let accessToken = /access_token=(.*?)&/.exec(window.location.href);
    let expirationTime = /expires_in=(.*)/.exec(window.location.href);
    if (accessToken && expirationTime) {
      console.log('Acquired access token: ' + accessToken);
      currentAccessToken = accessToken[1];
      expirationTimeInSeconds = expirationTime[1];
      window.setTimeout(() => currentAccessToken = '', expirationTimeInSeconds * 1000);
      window.history.pushState('Access Token', null, '/');
      return currentAccessToken;
    } else {
      console.log('No access token found.');
      return '';
    }
  },
  search: async function(searchTerm) {
    let accessToken = await this.getAccessToken();
    if (!accessToken) {
      console.log('No access token present.');
      sessionStorage.setItem('searchTerm', searchTerm);
      window.location.replace(authorizationUrl);
      return [];
    }

    const term = encodeURI(searchTerm);
    return fetch(`https://api.spotify.com/v1/search?q=${term}&type=track`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    .then(response => {
        if (response.ok) {
          return response.json();
        }
        console.log('Search query failed.');
    }, networkError => console.log(networkError.message)
    )
    .then(jsonResponse => {
      if (jsonResponse && jsonResponse.tracks) {
        return jsonResponse.tracks.items.map(track => {
          return {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            uri: track.uri
          }
        });
      }
      else if (jsonResponse && jsonResponse.error) {
        console.log(`Search query error: ${jsonResponse.error.message}`);
      }
      else {
        return [];
      }
    });
  },
  savePlaylist: async function(playlistName, playlistTracks) {
    if (!playlistName || !playlistTracks || playlistTracks.length === 0) {
      return;
    }

    let accessToken = await this.getAccessToken();
    if (!accessToken) {
      console.log('No access token present.');
      // Save playlist information to session storage here
      window.location.replace(authorizationUrl);
      return;
    }

    // Fetch user ID
    const headers = { Authorization: `Bearer ${accessToken}`,
                      Accept: 'application/json',
                      'Content-Type': 'application/json'};
    const userID = await fetch('https://api.spotify.com/v1/me', {
      headers: headers
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      console.log('Error querying user ID.');
    }, networkError => console.log(networkError.message)
    )
    .then(jsonResponse => {
      if (jsonResponse && jsonResponse.id) {
        return jsonResponse.id;
      }
      else if (jsonResponse && jsonResponse.error) {
        console.log(`Error querying user ID: ${jsonResponse.error.message}`);
      }
    });

    if (!userID) {
      return;
    }

    // Create playlist
    const playlistID = await fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({name: playlistName})
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      console.log(`Error creating playlist ${playlistName}.`);
    }, networkError => console.log(networkError.message)
    )
    .then(jsonResponse => {
      if (jsonResponse && jsonResponse.id) {
        return jsonResponse.id;
      }
      else if (jsonResponse && jsonResponse.error) {
        console.log(`Error creating playlist ${playlistName}: ${jsonResponse.error.message}`);
      }
    });

    if (!playlistID) {
      return;
    }

    // Save tracks to playlist
    const snapshotID = await fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks?`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({uris: playlistTracks})
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }
      console.log(`Error saving playlist ${playlistName}.`);
    }, networkError => console.log(networkError.message)
    )
    .then(jsonResponse => {
      if (jsonResponse && jsonResponse.snapshot_id) {
        return jsonResponse.snapshot_id;
      }
      else if (jsonResponse && jsonResponse.error) {
        console.log(`Error saving playlist ${playlistName}: ${jsonResponse.error.message}`);
      }
    });

  }
}



export { Spotify };
