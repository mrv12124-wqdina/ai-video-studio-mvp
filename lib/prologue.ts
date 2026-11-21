export type PrologueShot = {
  id: string;
  chapter: string;
  title: string;
  seconds: number;
  prompt: string;
  transition: string;
  dialogue?: string;
};

export const PROLOGUE_TITLE = "My Beautiful Women — Prologue: The Disappearance of the Fang Family Heir";

export const PROLOGUE_STYLE = [
  "Premium cinematic realistic 2D anime feature film, hand-drawn theatrical animation, Hollywood-level visual storytelling",
  "refined and anatomically accurate character design, crisp readable facial features, expressive natural eyes, delicate hand-drawn linework",
  "rich but restrained painted textures, subtle organic film grain, realistic fabric and architecture details, physically believable lighting",
  "natural color grading, layered atmospheric depth, sophisticated cinematic composition, consistent character models and locations",
  "16:9 widescreen, 24fps animation feel, coherent spatial continuity, no on-screen text, no subtitles, no logos, no watermark"
].join(", ");

export const PROLOGUE_NEGATIVE = [
  "photorealistic live action, 3D CGI, plastic skin, beauty filter, airbrushed face, waxy skin, artificial glossy eyes",
  "generic AI art, overprocessed image, excessive bloom, excessive lens flare, oversaturated colors, random particles",
  "low resolution, blurry face, muddy details, deformed anatomy, malformed hands, extra fingers, extra limbs",
  "inconsistent character identity, changing hairstyle, changing clothing, changing age, distorted perspective",
  "text, captions, subtitles, logo, watermark, frame, border, UI elements, split screen, collage, slideshow"
].join(", ");

export const PROLOGUE_SHOTS: PrologueShot[] = [
  {
    id: "P01",
    chapter: "Scene 1 — Spring in Jiangnan",
    title: "The Beauty of Spring",
    seconds: 5,
    prompt: "An expansive traditional Jiangnan garden in late spring, magnificent peonies and pink tree peonies in full bloom, delicate petals drifting through a gentle breeze, elegant stone paths, old trees and refined Chinese garden architecture. Peaceful, graceful and naturally alive. Extreme wide aerial establishing shot, descending slowly toward the garden, soft morning sunlight and delicate atmospheric perspective.",
    transition: "A foreground flower petal drifts across the lens and reveals the modern city.",
  },
  {
    id: "P02",
    chapter: "Scene 1 — Spring in Jiangnan",
    title: "An Unusual City",
    seconds: 5,
    prompt: "The modern Chinese city of Nanzhou in Jiangnan Province, expansive skyline, residential towers, commercial districts and elevated roads under clear spring daylight. Police vehicles and temporary road barriers interrupt the otherwise ordinary city rhythm. Extreme wide aerial city shot, gliding forward and descending toward a major intersection, restrained cinematic color grading.",
    transition: "Descend from the aerial view into a ground-level checkpoint shot.",
  },
  {
    id: "P03",
    chapter: "Scene 1 — Spring in Jiangnan",
    title: "Citywide Security Checkpoints",
    seconds: 5,
    prompt: "At a major exit road in Nanzhou, Chinese police officers in accurate dark-blue uniforms inspect a stopped black sedan. The driver presents identification through the open window while a long line of cars waits behind traffic barriers. Medium-wide side tracking shot, natural vehicle movement, crisp uniform and street details, neutral daylight.",
    transition: "Hard cut from the driver's documents to officers checking pedestrians nearby.",
  },
  {
    id: "P04",
    chapter: "Scene 1 — Spring in Jiangnan",
    title: "Searching the Streets",
    seconds: 5,
    prompt: "A busy Chinese neighborhood street under heightened security. Uniformed police officers carefully question passersby while ordinary residents move through shops and narrow lanes, visibly confused and uneasy. Medium tracking shot moving through the crowd, layered foreground and background, natural walking cycles, subtle human expressions.",
    transition: "The camera follows one passerby and racks focus to a woman carrying a toddler.",
  },
  {
    id: "P05",
    chapter: "Scene 1 — Spring in Jiangnan",
    title: "The Children Become the Focus",
    seconds: 5,
    prompt: "A young Chinese woman carries a small toddler along the sidewalk. A police officer notices the child and approaches politely to ask questions. Begin with a close-up of the toddler's tiny hand and curious face, then tilt up to the officer's increasingly serious expression. Natural child proportions, delicate facial detail, restrained suspense.",
    transition: "Cut along the officer's gaze to a convoy of black luxury cars.",
  },
  {
    id: "P06",
    chapter: "Scene 1 — Spring in Jiangnan",
    title: "The Black-Suited Search Team",
    seconds: 6,
    prompt: "Several black luxury sedans stop in sequence on a Nanzhou street. Tall, strong Chinese bodyguards in tailored black suits and black sunglasses step out with disciplined urgency. Each man holds the same printed photograph of a missing two-year-old boy. Low-angle tracking shot beside the team, precise suit fabric, believable coordinated movement, imposing but grounded presence.",
    transition: "Match cut from the missing-child photograph to a residential door opening.",
  },
  {
    id: "P07",
    chapter: "Scene 1 — Spring in Jiangnan",
    title: "A Citywide House-to-House Search",
    seconds: 6,
    prompt: "A cinematic three-location montage: bodyguards present official authorization papers at an elegant luxury villa, then inspect a modern apartment building, then respectfully enter a modest older neighborhood home. Show the contrast between wealth and ordinary life while maintaining the same black-suited search team. Clean match cuts, controlled tracking camera, natural gestures and detailed architecture.",
    transition: "A distant infant cry interrupts the montage; cut sharply to a bodyguard reacting.",
  },
  {
    id: "P08",
    chapter: "Scene 1 — Spring in Jiangnan",
    title: "The Sound of a Baby Crying",
    seconds: 5,
    prompt: "Close-up of a Chinese bodyguard in a black suit and sunglasses as he suddenly hears a baby crying off-screen. His head turns sharply, his posture stiffens, and he immediately runs toward a nearby building as two teammates follow. Start on his focused expression, then use a quick controlled tracking move. Convincing running mechanics, no exaggerated action effects.",
    transition: "Cut from the running team to a majestic aerial view of an ancient estate.",
  },
  {
    id: "P09",
    chapter: "Scene 2 — Qingyun Manor",
    title: "The Ancient Estate",
    seconds: 6,
    prompt: "Qingyun Manor in the northern suburbs of Nanzhou, a vast historic Chinese aristocratic estate with grand halls, curved tiled roofs, red walls, stone courtyards and ancient trees. The estate stretches across a broad landscape and feels centuries old. Extreme-wide aerial approach, slowly descending toward the main residence in warm late-afternoon light.",
    transition: "The aerial movement becomes a slow tracking shot along the main gate.",
  },
  {
    id: "P10",
    chapter: "Scene 2 — Qingyun Manor",
    title: "The Legacy of the Fang Family",
    seconds: 6,
    prompt: "Detailed cinematic views of Qingyun Manor's monumental stone guardian lions, elaborately carved wooden entrance doors, aged red walls, traditional roof brackets and a large dark wooden plaque above the gate. Slow horizontal architectural tracking shot ending in a gentle push toward the plaque. Intricate hand-painted wood and stone textures.",
    transition: "The plaque's dark wood texture dissolves into an old historical photograph.",
  },
  {
    id: "P11",
    chapter: "Scene 2 — Qingyun Manor",
    title: "A Family That Never Forgot Its Homeland",
    seconds: 8,
    prompt: "A historically grounded three-part montage: late-Qing-era Fang family members leave their ancestral home carrying travel trunks; an early twentieth-century Chinatown overseas shows Chinese shopfronts and family life; during the War of Resistance Against Japanese Aggression, overseas Chinese organize donations and supplies for their homeland. Period-appropriate clothing, architecture and props, muted archival-inspired colors, solemn and sincere tone, elegant dissolves.",
    transition: "Dissolve from wartime relief supplies into a modern charitable meeting.",
  },
  {
    id: "P12",
    chapter: "Scene 2 — Qingyun Manor",
    title: "A Billion-Dollar Gift",
    seconds: 6,
    prompt: "Inside a refined modern meeting room at Qingyun Manor, Fang family representatives exchange signed philanthropic documents with local government officials and shake hands respectfully. The donation is one billion US dollars, dedicated to public welfare in Nanzhou. Begin with a close-up of the documents and handshake, then pull back to reveal the formal gathering. Understated wealth, natural interior lighting.",
    transition: "Follow the handshake upward to reveal the family patriarch standing nearby.",
  },
  {
    id: "P13",
    chapter: "Scene 2 — Qingyun Manor",
    title: "The Patriarch of Qingyun",
    seconds: 7,
    prompt: "Character identity lock: Fang Tianhao, a sixty-year-old Chinese billionaire patriarch, tall and powerfully built with broad shoulders, a sharp eagle-like nose, deep-set intense eyes, strong eyebrows, a mature jawline, short black hair with subtle gray strands and fine natural wrinkles. He wears the same elegant dark traditional Tang suit in every shot. He stands calmly inside Qingyun Manor. Low-angle introduction, tilt slowly from shoes to face, commanding but restrained presence.",
    transition: "Move past Fang Tianhao's shoulder to reveal the lively courtyard.",
  },
  {
    id: "P14",
    chapter: "Scene 2 — Qingyun Manor",
    title: "The Return of Prosperity",
    seconds: 5,
    prompt: "Qingyun Manor has regained its former liveliness. Luxury vehicles line the stone courtyard, formally dressed guests arrive, household staff move naturally through the halls and warm conversation fills the estate. Smooth stabilized camera glide through the courtyard, refined traditional architecture, golden afternoon sunlight. The mood is prosperous but not extravagant.",
    transition: "The warm music falls away as the image fades into the dim main hall.",
  },
  {
    id: "P15",
    chapter: "Scene 3 — The Missing Grandson",
    title: "The Atmosphere Changes",
    seconds: 5,
    prompt: "The enormous main hall of Qingyun Manor is now tense and silent. Black-suited bodyguards, servants, doctors and nurses stand in uneasy rows with lowered eyes. Fang Tianhao stands at the center in his established dark Tang suit. Slow forward dolly through the silent crowd toward him, subdued warm interior light and deep natural shadows.",
    transition: "A sudden table impact interrupts the silence; hard cut to his hand.",
  },
  {
    id: "P16",
    chapter: "Scene 3 — The Missing Grandson",
    title: "The Patriarch's Rage",
    seconds: 5,
    prompt: "Fang Tianhao, preserving the exact established face and dark Tang suit, slams one hand onto a heavy wooden table. A teacup jolts and loose documents scatter from the impact. His eyes burn with anger and desperation. Medium close-up with a rapid push toward his face, physically believable impact, intense but anatomically natural expression. Dialogue: 'Three days! If my grandson is not found within three days, every one of you will pay with your lives!'",
    transition: "Hard cut to the frightened faces of the people facing him.",
  },
  {
    id: "P17",
    chapter: "Scene 3 — The Missing Grandson",
    title: "No One Dares to Speak",
    seconds: 4,
    prompt: "Reaction montage inside the main hall: a black-suited bodyguard lowers his eyes, a middle-aged doctor nervously adjusts his glasses, and a nurse grips a medical folder. Nobody dares to look directly at Fang Tianhao. Three restrained close-ups followed by a wider group composition, realistic subtle expressions and natural gestures.",
    transition: "The camera returns to Fang Tianhao and slowly closes in.",
  },
  {
    id: "P18",
    chapter: "Scene 3 — The Missing Grandson",
    title: "Two Days Without Sleep",
    seconds: 5,
    prompt: "Extreme close-up of Fang Tianhao's established face: bloodshot tired eyes, fine wrinkles, heavy breathing and a slightly trembling hand. The normally powerful patriarch looks exhausted after two sleepless nights. Very slow push toward his eyes, soft side lighting that reveals natural facial texture, restrained emotional acting.",
    transition: "His gaze drops; cut to the framed photograph on the table.",
  },
  {
    id: "P19",
    chapter: "Scene 3 — The Missing Grandson",
    title: "The Photograph of Fang Ao",
    seconds: 6,
    prompt: "A framed photograph rests on a large wooden table. It shows Fang Ao, the same adorable two-year-old Chinese boy in every appearance: soft rounded cheeks, clear dark eyes, short black hair, a tiny pointing hand and an innocent radiant smile, wearing simple light-colored toddler clothes. Slow macro push toward the child's face inside the photograph. Warm delicate highlight against the dark hall.",
    transition: "An older hand enters the frame and gently touches the glass.",
  },
  {
    id: "P20",
    chapter: "Scene 3 — The Missing Grandson",
    title: "A Grandfather's Love",
    seconds: 7,
    prompt: "Fang Tianhao gently lifts the framed photograph of Fang Ao. His large mature hand carefully touches the child's smiling face through the glass. His stern expression softens into tenderness and helpless longing. Begin on the fingers and photograph, then tilt upward to his face. Dialogue: 'My dear Ao'er... Grandpa misses you so much. It's been two days. Where are you?' Delicate natural lip movement and subtle eye animation.",
    transition: "Hold on his moist eyes, then reveal a tear beginning to fall.",
  },
  {
    id: "P21",
    chapter: "Scene 3 — The Missing Grandson",
    title: "The Tears of a Powerful Man",
    seconds: 5,
    prompt: "Extreme close-up of Fang Tianhao's mature Chinese face. A single tear slowly travels down his cheek. His deep-set eyes remain fixed on the photograph; his lips tighten as he struggles to control his emotions. The mighty patriarch is simply a grandfather who has lost his beloved grandson. Static intimate framing, delicate facial animation, natural skin shading and restrained emotional realism.",
    transition: "He slowly raises his head; the music begins to build.",
  },
  {
    id: "P22",
    chapter: "Scene 3 — The Missing Grandson",
    title: "The Order to Find His Grandson",
    seconds: 7,
    prompt: "Fang Tianhao slowly raises his head and looks across the room. His sorrow transforms into determination. He addresses the silent bodyguards, doctors and servants in a low but authoritative voice. Three-quarter medium close-up with a gradual push-in, strong natural eye detail. Dialogue: 'Listen carefully. I don't care whether they come from the legitimate world or the underworld. Whoever finds my grandson can name their price!'",
    transition: "Cut to his hand tightening around the framed photograph.",
  },
  {
    id: "P23",
    chapter: "Scene 3 — The Missing Grandson",
    title: "The Price of His Love",
    seconds: 6,
    prompt: "Fang Tianhao grips the framed photograph firmly, his expression resolute and desperate. Two black-suited bodyguards behind him exchange shocked glances. Begin with a close-up of his hand and the frame, then move upward to his determined face. Dialogue: 'Power, wealth... Even if you demand the entire Fang family fortune, I will give it to you!' Natural hand anatomy, restrained dramatic acting.",
    transition: "His voice fades; hold on his face as his body begins to lose balance.",
  },
  {
    id: "P24",
    chapter: "Scene 3 — The Missing Grandson",
    title: "The Collapse",
    seconds: 6,
    prompt: "After two sleepless nights and overwhelming emotional strain, Fang Tianhao suddenly loses consciousness. His body sways, the framed photograph slips from his hand, and he falls backward. Doctors and black-suited bodyguards rush forward to support him. Medium action shot with a controlled camera shake and a brief slow-motion insert of the falling frame. Dialogue from the room: 'Master Fang!' Convincing gravity and realistic body movement.",
    transition: "The frame lands on the carpet; cut to a low-angle close-up.",
  },
  {
    id: "P25",
    chapter: "Scene 3 — The Missing Grandson",
    title: "The Smiling Child",
    seconds: 5,
    prompt: "A framed photograph lies on the carpet inside the grand traditional Chinese hall. Fang Ao's innocent smiling face remains clear in the photograph. In the softly blurred background, doctors and bodyguards rush toward the collapsed patriarch. Emotional contrast between the child's bright smile and the family's desperate crisis. Slow cinematic push toward the photograph, then a gradual fade to black. Final title to be added in editing, not generated in the image.",
    transition: "Slow fade to black; add the episode title in post-production.",
  }
];

export const PROLOGUE_TOTAL_SECONDS = PROLOGUE_SHOTS.reduce((sum, shot) => sum + shot.seconds, 0);
