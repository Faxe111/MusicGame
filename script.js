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

    let songs = [];
    const deck = document.getElementById('deck');
    const timeline = document.getElementById('timeline');
    const discard = document.getElementById('discard');
    const info = document.getElementById('info');
    const restartButton = document.getElementById('restartButton');

    let draggedCard = null;
    let gameStarted = false;
    let correctCount = 0;
    const WIN_COUNT = 10;

    function updateInfo() {
      if (correctCount >= WIN_COUNT) {
        info.textContent = '🎉 Du hast 10 Songs richtig einsortiert und gewonnen!';
        deck.style.display = 'none';
        discard.style.display = 'none';
        restartButton.style.display = 'inline-block';
      } else {
        info.textContent = `Noch ${WIN_COUNT - correctCount} Songs bis zum Sieg`;
      }
    }

    function createCard(song, showAll = false) {
      const card = document.createElement('div');
      card.className = 'card';
      card.draggable = true;
      card.dataset.year = song.year;
      card.dataset.title = song.title;
      card.dataset.artist = song.artist;

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      const front = document.createElement('div');
      front.className = 'card-front';
      front.innerHTML = `<img src="${song.image}" alt="QR Code" style="max-width: 100%; max-height: 100%;" />`;

      const back = document.createElement('div');
      back.className = 'card-back';
      if (showAll) {
        back.innerHTML = `<strong>${song.title}</strong><br/><em>${song.artist}</em><br/><span>${song.year}</span>`;
      } else {
        back.innerHTML = `<span>${song.year}</span>`;
      }

      inner.appendChild(front);
      inner.appendChild(back);
      card.appendChild(inner);

      card.addEventListener('dragstart', () => {
        draggedCard = card;
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });

      return card;
    }

    function createGuessInterface(card) {
      const back = card.querySelector('.card-back');
      if (back.querySelector('input')) return;

      const container = document.createElement('div');
      container.style.marginTop = '10px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.gap = '5px';

      const inputTitle = document.createElement('input');
      inputTitle.placeholder = 'Songtitel';
      const inputArtist = document.createElement('input');
      inputArtist.placeholder = 'Artist';

      const guessButton = document.createElement('button');
      guessButton.textContent = 'Überprüfen';
      guessButton.style.marginTop = '5px';

      const skipButton = document.createElement('button');
      skipButton.textContent = "Skip";
      skipButton.style.marginTop = '5px';

      const reveal = () => {
        back.innerHTML = `<strong>${card.dataset.title}</strong><br/><em>${card.dataset.artist}</em><br/><span>${card.dataset.year}</span>`;
        card.appendChild(card.querySelector('.card-inner'));
      };

      guessButton.onclick = () => {
        const titleCorrect = inputTitle.value.trim().toLowerCase() === card.dataset.title.toLowerCase();
        const artistCorrect = inputArtist.value.trim().toLowerCase() === card.dataset.artist.toLowerCase();
        reveal();
        if (titleCorrect && artistCorrect) {
          back.style.color = 'green';
        }
        setTimeout(() => {
          container.remove();
          drawNextCard();
        }, 100);
      };

      skipButton.onclick = () => {
        reveal();
        setTimeout(() => {
          container.remove();
          drawNextCard();
        }, 100);
      };

      container.appendChild(inputTitle);
      container.appendChild(inputArtist);
      container.appendChild(guessButton);
      container.appendChild(skipButton);

      back.appendChild(container);
    }

    function createDropzone(index) {
      const dz = document.createElement('div');
      dz.className = 'dropzone';

      dz.addEventListener('dragover', e => e.preventDefault());
      dz.addEventListener('drop', () => {
        if (!draggedCard) return;

        if (!gameStarted) {
          const firstCard = draggedCard;
          firstCard.classList.add('flipped');
          timeline.innerHTML = '';
          timeline.appendChild(createDropzone(0));
          timeline.appendChild(firstCard);
          timeline.appendChild(createDropzone(1));
          draggedCard = null;
          gameStarted = true;
          correctCount = 1;
          updateInfo();
          createGuessInterface(firstCard);
          return;
        }

        const year = parseInt(draggedCard.dataset.year);
        const cards = Array.from(timeline.querySelectorAll('.card'));
        const years = cards.map(c => parseInt(c.dataset.year));
        const correct = checkPosition(index, year, years);

        if (correct) {
          draggedCard.classList.add('flipped');
          timeline.insertBefore(draggedCard, timeline.children[index * 2]);
          draggedCard = null;
          correctCount++;
          updateInfo();
          renderDropzones();
          createGuessInterface(timeline.children[index * 2 + 1]);
        } else {
          draggedCard.classList.add('flipped');
          const back = draggedCard.querySelector('.card-back');
          back.innerHTML = `<strong>${draggedCard.dataset.title}</strong><br/><em>${draggedCard.dataset.artist}</em><br/><span>${draggedCard.dataset.year}</span>`;
          discard.innerHTML = '';
          discard.appendChild(draggedCard);
          draggedCard = null;
          drawNextCard();
          return;
        }
      });

      return dz;
    }

    function checkPosition(index, year, years) {
      const left = index === 0 ? -Infinity : years[index - 1];
      const right = index === years.length ? Infinity : years[index];
      return year >= left && year <= right;
    }


    function renderDropzones() {
      const cards = Array.from(timeline.querySelectorAll('.card'));
      timeline.innerHTML = '';
      for (let i = 0; i <= cards.length; i++) {
        timeline.appendChild(createDropzone(i));
        if (i < cards.length) timeline.appendChild(cards[i]);
      }
    }

    function drawNextCard() {
      if (correctCount >= WIN_COUNT || songs.length === 0) return;

      // Falls ein Eingabecontainer noch offen ist, behandle es wie ein Klick auf "Skip"
      const openInput = document.querySelector('.card-back div');
      if (openInput && openInput.querySelector('input')) {
        const back = openInput.parentElement;
        const card = back.closest('.card');
        back.innerHTML = `<strong>${card.dataset.title}</strong><br/><em>${card.dataset.artist}</em><br/><span>${card.dataset.year}</span>`;
      }

      if (deck.children.length > 0) return;

      const next = songs.shift();
      const card = createCard(next);
      deck.appendChild(card);
    }

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    function initGame() {
      songs = shuffleArray(allSongs.slice());
      deck.innerHTML = '';
      timeline.innerHTML = '';
      discard.innerHTML = '';
      draggedCard = null;
      gameStarted = false;
      correctCount = 0;
      restartButton.style.display = 'none';
      deck.appendChild(createCard(songs.shift()));
      timeline.appendChild(createDropzone(0));
      updateInfo();
    }

    restartButton.addEventListener('click', initGame);
    initGame();
    // Hier kannst du mit allSongs weiterarbeiten
    console.log(allSongs);
  });

