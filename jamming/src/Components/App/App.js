import React, { Component } from 'react';
import './App.css';
import { SearchResults } from './../SearchResults/SearchResults';
import { Playlist } from './../Playlist/Playlist';
import { SearchBar } from './../SearchBar/SearchBar';
import { Spotify } from './../../util/Spotify'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {searchResults: [],
      playlistName: 'My playlist',
      playlistTracks: []
    };
    this.addTrack = this.addTrack.bind(this);
    this.removeTrack = this.removeTrack.bind(this);
    this.updatePlaylistName = this.updatePlaylistName.bind(this);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.search = this.search.bind(this);
  }

  componentDidMount() {
    // TODO: break this functionality out into a new function called parseUserAuthorization()
    Spotify.getAccessToken();
    const searchTerm = sessionStorage.getItem('searchTerm');
    if (searchTerm) {
      // Simply setting the input value with "input.value =" won't work as it
      // doesn't trigger the React onChange event handler so we have to do this instead.
      const searchTermInput = document.getElementById('searchTerm');
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      const event = new Event('input', { bubbles: true });
      setValue.call(searchTermInput, searchTerm);
      searchTermInput.dispatchEvent(event);

      this.search(searchTerm);
      sessionStorage.removeItem('searchTerm');
    }
  }

  addTrack(track) {
    if (this.state.playlistTracks.find(savedTrack => savedTrack.id === track.id)) {
      return;
    }
    this.setState(prevState => ({ playlistTracks: [...prevState.playlistTracks, track] }) );
  }

  removeTrack(track) {
    this.setState(prevState => ({ playlistTracks: prevState.playlistTracks.filter(item => item !== track) }) );
  }

  updatePlaylistName(name) {
    this.setState({playlistName: name});
  }

  savePlaylist() {
    let trackURIs = this.state.playlistTracks.map(track => track.uri);
    Spotify.savePlaylist(this.state.playlistName, trackURIs);
    this.setState({playlistName: 'My playlist'});
    this.setState({playlistTracks: [] });
  }

  search(searchTerm) {
    Spotify.search(searchTerm)
    .then(tracks => this.setState({searchResults: tracks}));
  }

  render() {
    return (
      <div>
        <h1>Ja<span className="highlight">mmm</span>ing</h1>
        <div className="App">
          <SearchBar onSearch={this.search}/>
          <div className="App-playlist">
            <SearchResults searchResults={this.state.searchResults} onAdd={this.addTrack}/>
            <Playlist playlistName={this.state.playlistName} playlistTracks={this.state.playlistTracks}
               onRemove={this.removeTrack} onNameChange={this.updatePlaylistName} onSave={this.savePlaylist}/>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
