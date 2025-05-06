// script.js
fetch('songs.json')
  .then(response => response.json())
  .then(data => {
    const allSongs = data.map(song => ({
      title: song.name,
      year: parseInt(song.year),
      artist: song.artist,
      image: `qrcodes/${song.version}_${song.number}.jpg`,
    }));

    // Hier kannst du mit allSongs weiterarbeiten
    console.log(allSongs);
  });

