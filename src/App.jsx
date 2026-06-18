import React, { useState, useEffect, useRef } from 'react';
import { cinematographyProjects } from './CinematographyProjects';
import { soundtracksProjects } from './SoundtracksProjects';
import { gamesProjects } from './GamesProjects';
import './App.css';

export default function App() {
  // Phases: 0=Home, 1=Releases, 2=Cinematics(Transition), 3=Cinematography, 4=Soundtracks, 5=Games, 6=About Me
  const [phase, setPhase] = useState(0);
  const [activeTrack, setActiveTrack] = useState(null);

  // States for 80% expanded sub-sections
  const [activeVideoProject, setActiveVideoProject] = useState(null);
  const [activeGameProject, setActiveGameProject] = useState(null);
  const [isWipExpanded, setIsWipExpanded] = useState(false); // 🚀 NUOVO: Stato per ingrandire la card Work in Progress

  // State to slide through media in the Games gallery
  const [mediaIndex, setMediaIndex] = useState(0);

  // iOS SPOTLIGHT SEARCH BAR STATES
  const [searchQuery, setSearchQuery] = useState('');
  const searchContainerRef = useRef(null);

  // REFS PER LO SCROLL E LA NAVIGAZIONE NATIVA
  const lastScrollTime = useRef(0);
  const touchStartY = useRef(null);
  const verticalTrackRef = useRef(null);

  // REFS PER L'ANIMAZIONE SCROLL-LINKED DEL CONTROLLER E LE NOTE PARALLASSE
  const gamesSectionRef = useRef(null);
  const controllerRef = useRef(null);
  const gamesContentRef = useRef(null);
  const notesContainerRef = useRef(null); // 🚀 NUOVO: Riferimento per lo sfondo delle note musicali

  // "LET'S TALK!" FORM STATES
  const [isTalkOpen, setIsTalkOpen] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // REFS FOR ABOUT ME CAROUSEL HORIZONTAL SCROLL
  const aboutRowRef1 = useRef(null);
  const aboutRowRef2 = useRef(null);

  const aboutImages = [
    "public/griglia_1.jpg", "public/griglia_5.png", "public/griglia_10.png", "public/img.png",
    "public/Lost_Deer_Anteprima.png", "public/griglia_6.png", "public/griglia_11.png", "public/griglia_17.png",
    "public/griglia_3.jpg", "public/griglia_7.png", "public/griglia_12.png", "public/griglia_16.png",
    "public/griglia_4.jpg", "public/griglia_8.png", "public/griglia_13.png", "public/griglia_15.png",
    "public/griglia_9.png", "public/griglia_14.jpg",
  ];

  // Generiamo una lista fissa di 150 note sparse casualmente per lo sfondo parallasse
  const [musicalNotes] = useState(() =>
      Array(150).fill(null).map((_, i) => ({
        id: i,
        char: ['♪', '♫', '♩', '♬', '♭', '♮'][Math.floor(Math.random() * 6)],
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 0.8 + Math.random() * 1.5,
        opacity: 0.15 + Math.random() * 0.25
      }))
  );

  // ==========================================================================
  // DYNAMIC IMAGE MAPPING LOGIC FOR SOUNDTRACK ALBUMS
  // ==========================================================================
  const getReleaseImage = (release) => {
    if (release.type !== 'soundtrack') {
      return release.mediaList ? release.mediaList[1] : (release.previewImg || 'public/Photo_Home.jpg');
    }
    switch (release.album) {
      case "Her": return "public/Her_Anteprima.jpg";
      case "Liber Libertatis": return "public/Liber_Libertatis_Anteprima.png";
      case "Pirate Journey": return "public/images/cover_pirate.jpg";
      default: return "public/Photo_Home.jpg";
    }
  };

  const allCinema = cinematographyProjects.map(p => ({...p, type: 'cinematography', emoji: '🎬'}));
  const allSoundtracks = soundtracksProjects.map(p => ({...p, type: 'soundtrack', emoji: '🎻', trackData: p}));
  const allGames = gamesProjects.map(p => ({...p, type: 'games', emoji: '🕹️'}));
  const globalProjectsDatabase = [...allCinema, ...allSoundtracks, ...allGames];

  const automaticLatestReleases = [
    allCinema[0], allCinema[1], allSoundtracks[0], allGames[0]
  ].filter(Boolean);

  const getYouTubeEmbed = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1`;
    }
    return url;
  };

  const handleGlobalProjectOpen = (project) => {
    setSearchQuery('');
    if (project.type === 'cinematography') {
      scrollToPhase(3);
      setActiveVideoProject(project);
    } else if (project.type === 'soundtrack') {
      scrollToPhase(4);
      setActiveTrack(project.trackData || project);
    } else if (project.type === 'games') {
      scrollToPhase(5);
      setMediaIndex(0);
      setActiveGameProject(project);
    }
  };

  const scrollToPhase = (targetPhase) => {
    setActiveVideoProject(null);
    setActiveGameProject(null);
    setIsTalkOpen(false);
    setIsWipExpanded(false);

    if (targetPhase < 2) {
      setPhase(targetPhase);
      if (verticalTrackRef.current) verticalTrackRef.current.scrollTop = 0;
    } else {
      setPhase(targetPhase);
      setTimeout(() => {
        document.getElementById(`fase-${targetPhase}`)?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  // 🔍 LOGICA DELLA BARRA DI RICERCA (Ripristinata!)
  const filteredResults = searchQuery.trim() === ''
      ? []
      : globalProjectsDatabase.filter(p =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.synopsis && p.synopsis.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // MOTORE DI ANIMAZIONE SCROLL-LINKED + 🚀 NUOVA PARALLASSE NOTE
  const handleNativeScroll = () => {
    if (!verticalTrackRef.current) return;
    const scrollTop = verticalTrackRef.current.scrollTop;
    const vh = window.innerHeight;

    let newPhase = 2;
    if (scrollTop >= vh * 0.6 && scrollTop < vh * 1.6) newPhase = 3;
    else if (scrollTop >= vh * 1.6 && scrollTop < vh * 2.6) newPhase = 4;
    else if (scrollTop >= vh * 2.6 && scrollTop < vh * 3.6) newPhase = 5;
    else if (scrollTop >= vh * 3.6) newPhase = 6;

    if (phase !== newPhase) setPhase(newPhase);

    // 🚀 EFFETTO PARALLASSE NOTE MUSICALI
    if (notesContainerRef.current) {
      notesContainerRef.current.style.transform = `translateY(${-scrollTop * 0.2}px)`;
    }

    // Disegna l'animazione del controller fotogramma per fotogramma base allo scroll
    if (gamesSectionRef.current && controllerRef.current && gamesContentRef.current) {
      const gamesTop = gamesSectionRef.current.getBoundingClientRect().top;
      let progress = 1 - (gamesTop / vh);
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      if (progress > 0 && progress < 1) {
        controllerRef.current.style.display = 'flex';
        let opacity = (progress - 0.2) / 0.3;
        if (opacity < 0) opacity = 0;
        if (opacity > 1) opacity = 1;

        let scale = 0.3;
        let colorAlpha = 1;
        let bgAlpha = 0.95;

        if (progress >= 0.6) {
          const subProgress = (progress - 0.6) / 0.4;
          scale = 0.3 + (10 * subProgress);
          colorAlpha = 1 - subProgress;
          bgAlpha = 0.95 + (0.05 * subProgress);
        }

        controllerRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
        controllerRef.current.style.opacity = opacity;
        controllerRef.current.style.backgroundColor = `rgba(${20*(1-progress)}, ${20*(1-progress)}, ${25*(1-progress)}, ${bgAlpha})`;
        controllerRef.current.style.borderColor = `rgba(255, 255, 255, ${colorAlpha * 0.4})`;
        controllerRef.current.style.color = `rgba(255, 255, 255, ${colorAlpha})`;

        let contentOpacity = 0;
        let contentScale = 0.8;
        if (progress >= 0.8) {
          const contentProgress = (progress - 0.8) / 0.2;
          contentOpacity = contentProgress;
          contentScale = 0.8 + (0.2 * contentProgress);
        }
        gamesContentRef.current.style.opacity = contentOpacity;
        gamesContentRef.current.style.transform = `scale(${contentScale})`;

      } else if (progress === 1) {
        controllerRef.current.style.display = 'flex';
        controllerRef.current.style.transform = `translate(-50%, -50%) scale(10)`;
        controllerRef.current.style.backgroundColor = `#000000`;
        controllerRef.current.style.borderColor = `transparent`;
        controllerRef.current.style.color = `transparent`;
        gamesContentRef.current.style.opacity = 1;
        gamesContentRef.current.style.transform = `scale(1)`;
      } else {
        controllerRef.current.style.display = 'none';
        gamesContentRef.current.style.opacity = 0;
      }
    }
  };

  useEffect(() => {
    const handleWheel = (event) => {
      if (activeVideoProject || activeGameProject || isTalkOpen || isWipExpanded) return;

      if (phase >= 2) {
        const track = verticalTrackRef.current;
        if (track && track.scrollTop <= 0 && event.deltaY < 0) {
          const currentTime = Date.now();
          if (currentTime - lastScrollTime.current > 700) {
            setPhase(1);
            lastScrollTime.current = currentTime;
          }
        }
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastScrollTime.current < 700) return;
      if (Math.abs(event.deltaY) < 15) return;

      if (event.deltaY > 0) {
        if (phase === 0) setPhase(1);
        else if (phase === 1) setPhase(2);
        lastScrollTime.current = currentTime;
      } else if (event.deltaY < 0) {
        if (phase === 1) setPhase(0);
        lastScrollTime.current = currentTime;
      }
    };

    const handleTouchStart = (event) => {
      touchStartY.current = event.touches[0].clientY;
    };

    const handleTouchMove = (event) => {
      if (touchStartY.current === null) return;
      if (activeVideoProject || activeGameProject || isTalkOpen || isWipExpanded) return;

      const touchCurrentY = event.touches[0].clientY;
      const deltaY = touchStartY.current - touchCurrentY;

      if (phase >= 2) {
        const track = verticalTrackRef.current;
        if (track && track.scrollTop <= 0 && deltaY < -50) {
          const currentTime = Date.now();
          if (currentTime - lastScrollTime.current > 700) {
            setPhase(1);
            lastScrollTime.current = currentTime;
            touchStartY.current = null;
          }
        }
        return;
      }

      if (Math.abs(deltaY) < 50) return;
      const currentTime = Date.now();
      if (currentTime - lastScrollTime.current < 700) return;

      if (deltaY > 0) {
        if (phase === 0) setPhase(1);
        else if (phase === 1) setPhase(2);
        lastScrollTime.current = currentTime;
        touchStartY.current = null;
      } else if (deltaY < 0) {
        if (phase === 1) setPhase(0);
        lastScrollTime.current = currentTime;
        touchStartY.current = null;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [activeVideoProject, activeGameProject, isTalkOpen, phase, isWipExpanded]);

  useEffect(() => {
    const clickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const scrollAboutCarousel = (refElement, direction) => {
    if (refElement.current) {
      const scrollAmount = direction === 'right' ? 400 : -400;
      refElement.current.scrollBy({left: scrollAmount, behavior: 'smooth'});
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const nextMedia = (e) => {
    e.stopPropagation();
    if (!activeGameProject) return;
    setMediaIndex((prev) => (prev + 1) % activeGameProject.mediaList.length);
  };
  const prevMedia = (e) => {
    e.stopPropagation();
    if (!activeGameProject) return;
    setMediaIndex((prev) => (prev - 1 + activeGameProject.mediaList.length) % activeGameProject.mediaList.length);
  };

  return (
      <div
          className={`portfolio-wrapper fase-${phase} ${activeVideoProject || activeGameProject || isTalkOpen || isWipExpanded ? 'view-progetto-aperto' : ''}`}>

        {/* BACKGROUND DIRECTOR */}
        <div className="regia-sfondi">
          <div className="sfondo-strato sfondo-secondario"></div>
          <div className="sfondo-strato sfondo-principale"></div>

          {(phase === 2 || phase === 3) && (
              <video src="public/Sezione_3_portfolio.mp4" autoPlay loop muted playsInline
                     className="video-sfondo-cinematic-fase2"/>
          )}

          {/* 🚀 NUOVO CONTENITORE: Note musicali fluttuanti in parallasse per la sezione Soundtracks */}
          <div className="ponte-parallasse-note" ref={notesContainerRef}>
            {musicalNotes.map(note => (
                <span
                    key={note.id}
                    className="nota-parallasse-item"
                    style={{
                      top: `${note.top}%`,
                      left: `${note.left}%`,
                      fontSize: `${note.size}rem`,
                      opacity: note.opacity
                    }}
                >
                {note.char}
              </span>
            ))}
          </div>

          <div className="overlay-scuro-gradiente"></div>
        </div>

        <div className="interfaccia-contenitore">

          {/* SECTION 1: HOME */}
          <section className="colonna-sinistra-testi">
            <div className="barra-ricerca-spotlight-wrapper" ref={searchContainerRef}>
              <div className="capsula-ricerca-input">
                <span className="lente-icon-ios">🔍</span>
                <input type="text" placeholder="Search projects..." value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)} className="input-ricerca-real-ios"/>
                {searchQuery && <button className="clear-ricerca-btn" onClick={() => setSearchQuery('')}>✕</button>}
              </div>

              {filteredResults.length > 0 && (
                  <div className="tendina-risultati-ricerca">
                    <div className="intestazione-categoria-ricerca">SEARCH RESULTS ({filteredResults.length})</div>
                    <div className="lista-scroll-risultati">
                      {filteredResults.map((project, idx) => (
                          <div key={`${project.type}-${project.id}-${idx}`} className="riga-risultato-ricerca"
                               onClick={() => handleGlobalProjectOpen(project)}>
                            <span className="emoji-progetto-ricerca">{project.emoji}</span>
                            <div className="meta-testo-risultato">
                              <h4>{project.title}</h4>
                              <p>{project.type.toUpperCase()} — {project.role || "Composer"}</p>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
              )}
            </div>

            <div className="testi-principali">
              <p className="intro-nome"><strong>Alessio Buga</strong></p>
              <h1 className="titolo-monumentale titolo-interattivo-about">
                <span onClick={() => scrollToPhase(6)}>DIRECTOR</span> <br/>
                <span onClick={() => scrollToPhase(6)}>DOP</span> <br/>
                <span className="evidenziato-arancione" onClick={() => scrollToPhase(6)}>COMPOSER</span>
              </h1>
            </div>
            <span className="scroll-down"></span>
          </section>

          {/* INDEX COLUMN */}
          <aside className="colonna-destra-menu colonna-indice">
            <nav className="menu-superiore">
              <span className="link-estetico" onClick={() => scrollToPhase(0)}>Home</span>
              <div className="dropdown-projects-contenitore" key={phase}>
                <span className={`link-estetico voce-projects-trigger ${phase >= 3 && phase <= 5 ? 'attivo' : ''}`}>Projects ↓</span>
                <div className="tendina-sottomenu-ios">
                  <div className={`opzione-tendina ${phase === 3 ? 'selezionata' : ''}`} onClick={() => scrollToPhase(3)}>Cinematography</div>
                  <div className={`opzione-tendina ${phase === 4 ? 'selezionata' : ''}`} onClick={() => scrollToPhase(4)}>Soundtracks</div>
                  <div className={`opzione-tendina ${phase === 5 ? 'selezionata' : ''}`} onClick={() => scrollToPhase(5)}>Games</div>
                </div>
              </div>
              <span className={`link-estetico ${phase === 6 ? 'attivo' : ''}`} onClick={() => scrollToPhase(6)}>About</span>
              <span className={`link-estetico bottone-talk ${isTalkOpen ? 'attivo' : ''}`}
                    onClick={() => setIsTalkOpen(true)}>Let's talk!</span>
            </nav>
            <div className="blocco-inferiore-indice-collassabile">
              <div className="competenze-centro">
                <div className="riga-competenza-pulsante" onClick={() => scrollToPhase(3)}>Cinematography</div>
                <div className="riga-competenza-pulsante" onClick={() => scrollToPhase(4)}>Soundtracks</div>
                <div className="riga-competenza-pulsante" onClick={() => scrollToPhase(5)}>GAMES</div>
              </div>
              <div className="footer-destro">
                <p className="mini-bio">Scroll down to view work</p>
              </div>
            </div>
          </aside>

          {/* SECTION 2: LATEST RELEASES */}
          <section className="colonna-releases-pannello">
            <h2 className="titolo-releases">LATEST RELEASES</h2>
            <div className="griglia-lavori">
              {automaticLatestReleases.map((release, index) => (
                  <div
                      key={`release-${release.id}-${index}`}
                      className="box-lavoro item-latest-release-card"
                      onClick={() => {
                        setSearchQuery('');
                        // 🚀 SBLOCCO POP-UP: Imposta lo stato attivo senza chiamare scrollToPhase!
                        if (release.type === 'cinematography') {
                          setActiveVideoProject(release);
                        } else if (release.type === 'games') {
                          setMediaIndex(0);
                          setActiveGameProject(release);
                        } else if (release.type === 'soundtrack') {
                          // Le colonne sonore non hanno un pop-up modale separato, quindi le lasciamo andare alla sezione 4
                          setActiveTrack(release.trackData || release);
                          scrollToPhase(4);
                        }
                      }}
                      style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.75)), url(${getReleaseImage(release)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer'
                      }}
                  >
                    <div className="info-release-card">
                      <span className="tag-categoria-orange">{release.type.toUpperCase()}</span>
                      <h4>{release.title}</h4>
                      <p>{release.album || release.role || "Original Track"}</p>
                    </div>
                  </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              🚀 CONTENITORE A SCORRIMENTO CONTINUO NATIVO (FASI DA 2 A 6)
              ========================================================================= */}
          <div
              className={`track-scorrimento-verticale ${phase >= 2 ? 'visibile' : ''}`}
              ref={verticalTrackRef}
              onScroll={handleNativeScroll}
          >
            {/* FASE 2: Video Cinematico Loop di sfondo */}
            <div className="sezione-spacer-video" id="fase-2"></div>

            {/* SECTION 3: CINEMATOGRAPHY */}
            <section className="sezione-cinematography-schermo" id="fase-3">
              <h2 className="sezione-titolo-brutalist">CINEMATOGRAPHY</h2>
              <div className="split-cinematography">
                <div className="scheda-chiara colonna-projects">
                  <h3>PROJECTS</h3>
                  <div className="lista-verticale-video">
                    {cinematographyProjects.map((proj) => (
                        <div key={proj.id} className="elemento-video-card" onClick={() => setActiveVideoProject(proj)}>
                          <div className="guscio-mini-anteprima-video">
                            <img src={proj.previewImg || "public/Photo_Home.jpg"} alt="Preview"
                                 className="immagine-anteprima-blur"/>
                            <div className="finto-tasto-play-centrato">▶</div>
                          </div>
                          <div className="video-info" style={{ justifyContent: 'center' }}>
                            <h4 style={{ margin: 0 }}>{proj.title}</h4>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
                {/* 🚀 AGGIORNATO: Tasto di ingrandimento WIP cliccabile */}
                <div className="scheda-chiara colonna-wip" onClick={() => setIsWipExpanded(true)}>
                  <h3>WORK IN PROGRESS</h3>
                  <div className="foto-centrata-wip">
                    <div className="box-foto-reale"><p
                        style={{scale: "5", color: "red", fontFamily: "impact"}}>KNOCKOUT</p></div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: SOUNDTRACKS */}
            <section className="sezione-soundtracks-vuota" id="fase-4">
              <h2 className="sezione-titolo-brutalist">SOUNDTRACKS</h2>
              <div className="layout-split-audio">
                <div className="scheda-scura-audio-60">
                  <h3>PROJECTS</h3>
                  <div className="lista-verticale-audio">
                    {soundtracksProjects.map((item) => (
                        <div key={item.id}
                             className={`elemento-audio-card ${activeTrack?.id === item.id ? 'selezionato' : ''}`}
                             onClick={() => setActiveTrack(item)}>
                          <div className="play-button-cerchio">{activeTrack?.id === item.id ? '⏸' : '▶'}</div>
                          <div className="audio-testi"><h4>{item.title}</h4><p>{item.description} ({item.duration})</p>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
                <div className="spazio-destra-player">
                  {activeTrack ? (
                      <div className="spotify-player-widget-real animate-fade-in">
                        <iframe
                            src={`https://open.spotify.com/embed/track/${activeTrack.spotifyId}?utm_source=generator&theme=0`}
                            width="100%"
                            height="352"
                            frameBorder="0"
                            allowFullScreen=""
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                            title={activeTrack.title}
                            className="iframe-spotify-ios"
                        />
                        <button className="btn-chiudi-player-spotify" onClick={() => setActiveTrack(null)}>
                          ✕
                        </button>
                      </div>
                  ) : (
                      <div className="player-placeholder-vuoto"><p>Select a track to start listening on Spotify</p></div>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 5: GAMES */}
            <section className="sezione-games-schermo" id="fase-5" ref={gamesSectionRef}>
              <div className="portale-controller-ios" ref={controllerRef}>
                <div className="d-pad-disegnato">＋</div>
                <div className="tasti-disegnati">✜</div>
              </div>
              <div className="contenuto-games-effettivo" ref={gamesContentRef}>
                <h2 className="sezione-titolo-brutalist">GAMES</h2>
                <div className="scheda-games-70">
                  <h3>PROJECTS</h3>
                  <div className="griglia-games-scroll">
                    {gamesProjects.map((game) => (
                        <div key={game.id} className="elemento-game-card" onClick={() => {
                          setActiveGameProject(game);
                          setMediaIndex(0);
                        }}>
                          <img src={game.previewImg || "public/Photo_Home.jpg"} alt="Preview" className="game-thumb-immagine" />
                          <div className="game-details" style={{ display: 'flex', alignItems: 'center' }}>
                            <h4 style={{ margin: 0 }}>{game.title}</h4>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 6: ABOUT ME */}
            <section className="sezione-about-me-generale" id="fase-6">
              <div className="contenitore-internato-scroll-about">
                <h2 className="sezione-titolo-brutalist">ABOUT ME</h2>
                <div className="contenitore-frecce-wrapper-about">
                  <button className="freccia-nav-about sx"
                          onClick={() => scrollAboutCarousel(aboutRowRef1, 'left')}>‹
                  </button>
                  <button className="freccia-nav-about dx"
                          onClick={() => scrollAboutCarousel(aboutRowRef1, 'right')}>›
                  </button>
                  <div className="riga-orizzontale-scroll-about" ref={aboutRowRef1}>
                    <div className="blocco-about-card testo-card-about">
                      <span className="badge-anno-about">DIRECTING</span>
                      <p>LA DEA BENDATA - Award for best directing and best script</p>
                    </div>
                    <div className="blocco-about-card immagine-card-about"
                         style={{backgroundImage: "url('public/LDB_screen_1.png')"}}></div>
                    <div className="blocco-about-card testo-card-about">
                      <span className="badge-anno-about">MUSIC</span>
                      <p>Music composition for films and games</p>
                    </div>
                    <div className="blocco-about-card immagine-card-about"
                         style={{backgroundImage: "url('public/KNOCKOUT_screen_1.jpg')"}}></div>
                  </div>
                </div>

                <div className="contenitore-frecce-wrapper-about">
                  <button className="freccia-nav-about sx"
                          onClick={() => scrollAboutCarousel(aboutRowRef2, 'left')}>‹
                  </button>
                  <button className="freccia-nav-about dx"
                          onClick={() => scrollAboutCarousel(aboutRowRef2, 'right')}>›
                  </button>
                  <div className="riga-orizzontale-scroll-about" ref={aboutRowRef2}>
                    <div className="blocco-about-card immagine-card-about"
                         style={{backgroundImage: "url('public/KNOCKOUT_screen_2.jpg')"}}></div>
                    <div className="blocco-about-card testo-card-about">
                      <span className="badge-anno-about">FILM</span>
                      <p>THE CILENIAN - Sergio Castro San Martin</p>
                    </div>
                    <div className="blocco-about-card immagine-card-about"
                         style={{backgroundImage: "url('public/Screen_LCDS.png')"}}></div>
                    <div className="blocco-about-card testo-card-about">
                      <span className="badge-anno-about">VIDEOMAKING</span>
                      <p>Restaurant - Wedding - Backstage</p>
                    </div>
                  </div>
                </div>

                <div className="contenitore-instagram-about">
                  <a href="https://www.instagram.com/bugalessio?igsh=MWNnaTNwa3U5NDJ2eg==" target="_blank" rel="noopener noreferrer" className="link-instagram-about">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                  </a>
                </div>

                <div className="piastra-biografica-90">
                  <h3>COMPLETE BIOGRAPHY</h3>
                  <p>
                    Alessio Nicolas Buga is a 22-year-old self-taught composer and cinematography student. His lifelong passion for music was sparked during childhood upon discovering a small keyboard in his grandmother's room. After years of dedicated practice, he transitioned to digital composition at the age of sixteen, eventually crafting evocative original scores for short films and video games.
                  </p>
                  <p>
                    Expanding his creative vision, Alessio ventured into filmmaking in 2023. His cinematic debut, <em>LA DEA BENDATA</em>, quickly earned him his first industry awards, marking the beginning of a promising career in visual storytelling.
                  </p>
                  <p>
                    Since then, he has continuously broadened his portfolio through academic endeavors and independent documentaries. He recently helmed the docufiction <em>DIABOLICH</em>, taking full creative control over historical research, directing, editing, and color grading. Currently, he is bringing his visual expertise to the upcoming short film <em>KNOCKOUT</em>, serving as both Director of Photography and Colorist.
                  </p>
                  <div className="alloro-festival mini-alloro-about">
                    <span>Turin, Italy</span>
                  </div>
                </div>

                <div className="griglia-foto-about">
                  {aboutImages.map((imgUrl, index) => (
                      <div
                          key={`about-foto-${index}`}
                          className="foto-about-item"
                          style={{ backgroundImage: `url('${imgUrl}')` }}
                      ></div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* =========================================================================
              🚀 SCHEDE POP-OVER PER PROGETTI E GIOCHI
              ========================================================================= */}

          {/* 🚀 NUOVA MODALE: Work In Progress ingrandita al 70% cliccando ovunque per chiuderla */}
          <div className={`guscio-wip-fullscreen-overlay ${isWipExpanded ? 'attiva' : ''}`} onClick={() => setIsWipExpanded(false)}>
            <div className="guscio-wip-immagine-schermata-70" onClick={(e) => e.stopPropagation()}>
              <div className="box-foto-reale"><p style={{scale: "7", color: "red", fontFamily: "impact"}}>KNOCKOUT</p></div>
              <button className="bottone-chiudi-wip-mobile" onClick={() => setIsWipExpanded(false)}>✕</button>
            </div>
          </div>

          {/* 🚀 VIDEO DETAIL MODAL (AGGIORNATO CON LA X SULLA RIGA DEL TITOLO) */}
          <div className={`sottosezione-progetto-espansa ${activeVideoProject ? 'attiva' : ''}`}>
            {activeVideoProject && (
                <div className="guscio-interno-progetto">
                  <div className="testata-sottosezione">
                    <h2 className="titolo-progetto-aperto">{activeVideoProject.title}</h2>
                    <button className="bottone-chiudi-sottosezione" onClick={() => setActiveVideoProject(null)}>✕</button>
                  </div>
                  <div className="corpo-sottosezione-split">
                    <div className="blocco-video-40">
                      {activeVideoProject.videoUrl.includes('youtube.com') || activeVideoProject.videoUrl.includes('youtu.be') ? (
                          <iframe
                              src={getYouTubeEmbed(activeVideoProject.videoUrl)}
                              title={activeVideoProject.title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              className="video-player-ios"
                          />
                      ) : (
                          <video key={activeVideoProject.id} src={activeVideoProject.videoUrl} controls autoPlay
                                 muted className="video-player-ios"/>
                      )}
                    </div>
                    <div className="blocco-testo-descrizione">
                      <div className="badge-ruolo">{activeVideoProject.role}</div>
                      <p className="testo-sinossi">{activeVideoProject.synopsis}</p>
                      {activeVideoProject.festival && (
                          <div className="alloro-festival"><span className="icona-alloro">🏆</span> {activeVideoProject.festival}</div>
                      )}
                    </div>
                  </div>
                </div>
            )}
          </div>

          {/* 🚀 GAME MODAL (AGGIORNATO CON LA X SULLA RIGA DEL TITOLO) */}
          <div className={`sottosezione-progetto-espansa ${activeGameProject ? 'attiva' : ''}`}>
            {activeGameProject && (
                <div className="guscio-interno-progetto">
                  <div className="testata-sottosezione">
                    <h2 className="titolo-progetto-aperto">{activeGameProject.title}</h2>
                    <button className="bottone-chiudi-sottosezione" onClick={() => setActiveGameProject(null)}>✕</button>
                  </div>
                  <div className="corpo-sottosezione-split">
                    <div className="blocco-video-40 blocco-carosello-game">
                      <button className="freccia-carosello sinistra" onClick={prevMedia}>‹</button>
                      <button className="freccia-carosello destra" onClick={nextMedia}>›</button>
                      {mediaIndex === 0 && (activeGameProject.mediaList[0].includes('youtube.com') || activeGameProject.mediaList[0].includes('youtu.be')) ? (
                          <iframe src={getYouTubeEmbed(activeGameProject.mediaList[0])}
                                  title={activeGameProject.title} frameBorder="0" allowFullScreen
                                  className="video-player-ios"/>
                      ) : mediaIndex === 0 ? (
                          <video src={activeGameProject.mediaList[0]} controls autoPlay muted
                                 className="video-player-ios"/>
                      ) : (
                          <img src={activeGameProject.mediaList[mediaIndex]} alt="Screenshot"
                               className="screenshot-display-ios"/>
                      )}
                      <div className="indicatori-carosello-pallini">{activeGameProject.mediaList.map((_, idx) =>
                          <span key={idx} className={`pallino ${mediaIndex === idx ? 'attivo' : ''}`}/>)}</div>
                    </div>
                    <div className="blocco-testo-descrizione">
                      <div className="badge-ruolo">{activeGameProject.role}</div>
                      <p className="testo-sinossi">{activeGameProject.synopsis}</p>
                      {activeGameProject.linkStore && (
                          <a
                              href={activeGameProject.linkStore}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bottone-get-game-ios"
                          >
                            GET THE GAME ↗
                          </a>
                      )}
                    </div>
                  </div>
                </div>
            )}
          </div>

          {/* LET'S TALK MODAL */}
          <div className={`finestra-talk-back-sfocatura ${isTalkOpen ? 'aperta' : ''}`}
               onClick={() => setIsTalkOpen(false)}>
            <div className="guscio-finestra-talk-ios" onClick={(e) => e.stopPropagation()}>
              <div className="testata-talk-ios">
                <div className="titoli-talk-meta"><h2>LET'S TALK</h2><p>Get in touch or pitch your project</p></div>
                <button className="chiudi-talk-pulsante-cerchio" onClick={() => setIsTalkOpen(false)}>✕</button>
              </div>
              <form action="https://formsubmit.co/bugalessio2003@gmail.com" method="POST" encType="multipart/form-data"
                    className="corpo-form-talk-ios">
                <input type="hidden" name="_captcha" value="false"/>
                <div className="riga-form-doppia">
                  <div className="campo-input-box"><label>First Name</label><input type="text" name="First Name"
                                                                                   required/></div>
                  <div className="campo-input-box"><label>Last Name</label><input type="text" name="Last Name"
                                                                                  required/></div>
                </div>
                <div className="campo-input-box"><label>Email Address</label><input type="email" name="Email" required/>
                </div>
                <div className="campo-input-box">
                  <div className="label-con-contatore"><label>Message</label><span
                      className="contatore-caratteri-ios">{formMessage.length} / 10000</span></div>
                  <textarea name="Message" maxLength={10000} required value={formMessage}
                            onChange={(e) => setFormMessage(e.target.value)} className="textarea-talk-ios"/></div>
                <div className="campo-input-box"><label>Attachments</label>
                  <div className="area-drop-file-ios">
                    <input type="file" name="Attachment" id="upload-file-talk"
                           accept="video/*, image/*, .pdf, .ppt, .pptx" onChange={handleFileChange}
                           className="input-file-nascosto-ios"/>
                    <label htmlFor="upload-file-talk" className="etichetta-drop-finta"><span
                        className="freccia-cloud-icon">📥</span>{uploadedFile ? <strong>{uploadedFile.name}</strong> :
                        <span>Browse files</span>}</label></div>
                </div>
                <button type="submit" className="bottone-invia-talk-ios">Send Message ⚡️</button>
              </form>
            </div>
          </div>

        </div>
      </div>
  );
}