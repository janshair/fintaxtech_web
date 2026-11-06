import { brandingDesignQuestion } from './branding-design';

export const brandingGallery = {
  title: 'Branding templates',
  route: '/templates/branding/',
  description:
    'Explore logo styles, business stationery, social media design, print artwork and brand guidelines.',
};
export const logoGallery = {
  title: 'Logo styles',
  route: '/templates/branding/logo/',
  description:
    'Compare logo styles from the branding questionnaire using real brand marks and app icons.',
};
export const minimalismGuide = {
  title: 'Minimalism',
  route: '/templates/branding/logo/minimalism/',
  description:
    'See how minimalist logos communicate through shape, space and proportion, with Nike and Apple examples and practical advice for your own brand.',
};
export const referencePath = '/images/logo-references/';
type Example = [name: string, observation: string];
interface LogoReference {
  style: string;
  slug: string;
  brand: string;
  file: string;
  note: string;
  examples: Example[];
}
interface DesignGuide extends LogoReference {
  intro: string;
  sections: [heading: string, body: string][];
  brief: string;
}

export const minimalistExample: LogoReference = {
  style: 'Minimalism',
  slug: 'minimalism',
  brand: 'Nike',
  file: 'nike.svg',
  note: 'One sweeping shape changes from a heavy curve to a fine point. Your eye follows it forward.',
  examples: [
    ['Apple', 'The bite and separate leaf give a single-colour silhouette a memorable outline.'],
    ['Netflix', 'The red N app symbol folds a single letter into a compact shape.'],
    ['Mastercard', 'Two intersecting circles carry the identity without lettering.'],
    ['Uber', 'A short, spare wordmark lets the name carry the identity.'],
    ['Spotify', 'Three curved lines inside a circle suggest sound with very little detail.'],
  ],
};

export const designGuides: DesignGuide[] = [
  {
    style: 'Skeuomorphism',
    slug: 'skeuomorphism',
    brand: 'GarageBand',
    file: 'garageband.webp',
    note: 'Strings, tuning pegs and reflections make this app icon feel like a guitar you could pick up.',
    intro:
      'Turn an object your customer already knows into a visual shortcut. A guitar can introduce a music app before anyone has read its name. The craft lies in choosing which parts of the real object carry that meaning.',
    examples: [
      [
        'GarageBand',
        'The strings and tuning pegs identify a guitar even when the body is partly hidden.',
      ],
      ['Apple Books', 'The open pages borrow a physical gesture most readers recognise.'],
      [
        'Apple Contacts',
        'The tabbed address book makes a collection of digital names feel familiar.',
      ],
    ],
    sections: [
      [
        'What makes the object yours?',
        'A leatherworker might start with a stitching awl rather than a whole workbench. Its pointed tip and wooden handle tell a specific story. A highlight along the handle can suggest polished wood, but the outline has to identify the tool first. Choose an object your customers would recognise without a caption.',
      ],
      [
        'Where realism earns its keep',
        'This direction suits a maker, a specialist tool or an app that replaces a familiar physical task. A highly rendered object can convey care and knowledge of a trade. Fine texture is expensive to reproduce in embroidery, though. Ask for a simplified ink version early enough to influence the full-colour design.',
      ],
      [
        'Try the silhouette test',
        'Photograph an object associated with your work, trace its outline, then fill it in. Show the shape to someone who uses your service. If they identify it, add back just one material cue and ask what changed.',
      ],
    ],
    brief:
      'We repair acoustic instruments. Try a tuning peg with a worn brass finish, and show us a version we can stamp inside a guitar case.',
  },
  {
    style: 'Neomorphism',
    slug: 'neomorphism',
    brand: 'Apple System Settings',
    file: 'settings.webp',
    note: 'Look at the pale rim and the shadow beneath the gear. This raised-surface detail shows how a symbol can feel pressed out of its background.',
    intro:
      'Imagine pressing a shape into soft card. A narrow shadow on one edge and a pale highlight on the other can make the mark seem to rise from the same surface. You may also hear this approach called neumorphism or soft relief.',
    examples: [
      [
        'Apple System Settings',
        'The gear’s pale edge and recessed surroundings illustrate the raised-surface effect.',
      ],
      [
        'Apple Calculator on macOS Big Sur',
        'The small keys are a reference for how shallow relief can suggest touch.',
      ],
      [
        'Apple Messages on macOS Big Sur',
        'Look at the softly modelled speech bubble against its green tile.',
      ],
    ],
    sections: [
      [
        'How shallow relief changes the mood',
        'Low contrast can make an identity feel quiet and tactile. A designer chooses one light direction and keeps the depth consistent across the symbol. If every edge has an equally dark shadow, a soft impression can turn into a thick outline. The app icons here are references for particular edges and shadows.',
      ],
      [
        'Where to use the finish',
        'A ceramics studio could echo the maker’s stamp pressed into the base of a bowl. A pale screen treatment might look lovely beside a product photograph, yet disappear on a sunny phone screen. Develop a clear, solid version for invoices, small labels and any place where the surface colour is unpredictable.',
      ],
      [
        'Try a paper impression',
        'Press the back of a pen into thick paper and tilt it towards a window. Notice which edge catches light. Compare that impression with a dark ink drawing of the same shape at thumbnail size. Decide which details need to survive in both.',
      ],
    ],
    brief:
      'Our pottery stamp should feel gently pressed into clay. Show the soft relief on our website and the same recognisable outline on a delivery note.',
  },
  {
    style: 'Glassmorphism',
    slug: 'glassmorphism',
    brand: 'Apple Shortcuts',
    file: 'shortcuts.webp',
    note: 'Two coloured tiles overlap. Soft highlights and translucent edges make the upper tile look like frosted glass.',
    intro:
      'Picture two pieces of coloured glass laid over one another. The overlap forms a third colour and a bright edge reveals which piece sits in front. A logo can suggest that effect with a still image.',
    examples: [
      ['Apple Shortcuts', 'The coloured tiles make the overlap easy to spot.'],
      [
        'Windows Vista',
        'The glossy Windows orb is a historical reference for a highlight suggesting a glass surface.',
      ],
      [
        'Apple Photos',
        'The coloured petals demonstrate how translucent overlaps can preserve the shapes beneath.',
      ],
    ],
    sections: [
      [
        'What the layers communicate',
        'Transparency can suggest openness, lightness or the meeting of two ideas. For a collaboration tool, two independently recognisable shapes sharing a patch of colour can tell that story. A designer starts with their arrangement, then varies opacity until you can follow each shape through the overlap.',
      ],
      [
        'Choosing a background',
        'A translucent mark borrows colour from whatever sits behind it. It might be legible on a pale product screen and vanish over a bright photograph. Agree on a solid holding tile or a one-colour alternative for unpredictable backgrounds. For print, inspect a proof of the mixed colours on the paper you actually intend to buy.',
      ],
      [
        'Try the overlap test',
        'Cut two shapes from coloured film. Move them over white paper, a dark notebook and a photograph. Keep the arrangement that still reads as two distinct pieces on each surface.',
      ],
    ],
    brief:
      'Our software brings two teams together. Explore two overlapping panes and show the finished icon on our light dashboard and a busy event photograph.',
  },
  {
    style: 'Claymorphism',
    slug: 'claymorphism',
    brand: 'Reddit',
    file: 'reddit.svg',
    note: 'Snoo’s rounded head, antenna and soft shading make the mascot look moulded by hand.',
    intro:
      'Round a corner, soften a shadow and give a form a little weight. It starts to look as though you could pick it up. Clay-like branding uses that sense of touch to make a character or symbol feel approachable.',
    examples: [
      [
        'Reddit’s 3D Snoo',
        'The rounded head and antenna let you recognise the mascot from its outline.',
      ],
      ['Android’s 3D robot', 'Rounded forms make a technical product feel like a character.'],
      [
        'Duolingo’s 3D Duo',
        'The owl’s eyes and compact body carry its expression into dimensional artwork.',
      ],
    ],
    sections: [
      [
        'What makes it feel soft',
        'Large curves, broad highlights and gently darkened joins can suggest a hand-moulded object. A designer decides where the weight sits. A wide base can feel steady, while a large head on a small body often feels playful. The examples here illustrate rounded character treatments.',
      ],
      [
        'When playfulness helps',
        'This can be a good fit for a learning product, toy maker or family-focused service. Match the expression to the task. A cheerful character can welcome a learner, while a quieter pose may suit the same learner’s account settings. Keep a simplified face for stamps, small avatars and single-colour packaging.',
      ],
      [
        'Try making it by hand',
        'Roll the main features from three pieces of modelling clay. Photograph the result from straight ahead, shrink it to the size of a profile picture and ask which feature still identifies it. Give that feature priority in the final design.',
      ],
    ],
    brief:
      'We make a reading app for families. Give our character a curious expression and a silhouette that still works on a small reward sticker.',
  },
  {
    style: 'Maximalism',
    slug: 'maximalism',
    brand: 'Unilever',
    file: 'unilever.svg',
    note: 'From a distance you see a U. Look closer and a whole collection of tiny illustrations comes into focus.',
    intro:
      'A richly detailed logo gives someone a reason to look twice. The first glance should reveal the main shape. The second can uncover a story made from smaller pictures, patterns or lettering.',
    examples: [
      ['Unilever', 'Small illustrations build the silhouette of a much larger U.'],
      ['Porsche', 'The crest holds a horse, antlers, stripes and lettering inside one shield.'],
      [
        'Versace',
        'The Medusa emblem concentrates intricate hair and facial details around a central figure.',
      ],
    ],
    sections: [
      [
        'Give the detail a hierarchy',
        'Start by asking what the viewer should notice from the other side of a room. Give that shape the strongest outline. Then choose details that reward a closer look. For a food festival, a serving dish might contain illustrations of ingredients from local growers. Repeating one drawing style helps those ingredients feel related.',
      ],
      [
        'Where richer marks pay off',
        'Packaging, posters and large shop signs give people space to explore. A tiny social avatar offers less room. Agree on a smaller companion mark, perhaps a single ingredient or the outline of the dish. Decide in advance which version belongs on a poster and which belongs on a ticket stub.',
      ],
      [
        'Try two viewing distances',
        'Print the design and step back until the small details disappear. Name the overall shape. Move closer and pick out three details that tell you something about the business. A satisfying design works at both distances.',
      ],
    ],
    brief:
      'Our market brings local growers together. Build a generous, detailed emblem for our tote bags and pull out one recognisable element for the ticket stamp.',
  },
  {
    style: 'Brutalism',
    slug: 'brutalism',
    brand: 'Black Flag',
    file: 'black-flag.svg',
    note: 'Four blunt, staggered bars give this punk identity a raw visual rhythm. Their heavy edges are the detail to look at here.',
    intro:
      'A blunt edge, dense lettering or an abrupt shift in scale can make a mark feel urgent. This direction borrows the directness of a screen-printed gig poster or a notice pasted to a wall.',
    examples: [
      ['Black Flag', 'Four heavy bars create a quick, uneven beat.'],
      [
        'Public Image Ltd’s PiL',
        'The compact black-and-white monogram packs letters into a hard circular shape.',
      ],
      [
        'Run-DMC',
        'The bold lettering and thick horizontal rules give the name a strong block-like outline.',
      ],
    ],
    sections: [
      [
        'Choose the source of the force',
        'Black Flag’s bars get their energy from their staggered positions. Run-DMC uses the opposite move: thick rules hold the type firmly in place. These are useful references for raw graphic impact. Decide whether your own mark should feel steady, confrontational or deliberately unsettled before choosing the letters and shapes.',
      ],
      [
        'When directness fits',
        'An independent venue might need a mark that survives a photocopied listing and carries across a crowded street. A severe type treatment can do both. For longer messages such as opening hours or accessibility information, pair it with quieter, easy-to-read text. The logo can do the shouting on its own.',
      ],
      [
        'Try a one-ink poster',
        'Set the name at the top of a black-and-white poster and add a single line of event details underneath. Look from across the room. If the viewer can identify the act but cannot find the date up close, adjust the supporting layout.',
      ],
    ],
    brief:
      'Our rehearsal space should feel independent and loud. The mark needs to work in one ink on a door sign and a stack of photocopied flyers.',
  },
  {
    style: 'Liquid Glass',
    slug: 'liquid-glass',
    brand: 'Apple Podcasts',
    file: 'podcasts.webp',
    note: 'The central figure and rings catch light along their edges. This still shows Apple’s glass treatment for its app icons.',
    intro:
      'A highlight that appears to travel around an edge gives a digital icon a different presence from a printed symbol. Apple’s Liquid Glass treatment uses layers, light and refraction to produce that impression.',
    examples: [
      [
        'Apple Podcasts',
        'The central figure and surrounding rings stay legible beneath the glass finish.',
      ],
      ['Apple Photos', 'Coloured petals provide a clear structure for the layered treatment.'],
      ['Apple Camera', 'The lens gives the reflective treatment a natural focal point.'],
    ],
    sections: [
      [
        'Start with what stays still',
        'The lasting identity is the shape beneath the finish. A designer separates the foreground symbol from its background and chooses which edge should catch light. Too many shiny outlines compete for attention. For an audio app, a single broad sound-wave shape can carry the effect more clearly than a row of fine lines.',
      ],
      [
        'Plan for different appearances',
        'A digital-first brand can use glass to feel responsive and polished. Review it in light, dark and tinted icon appearances and on a real phone. A parcel label or an email signature cannot reproduce changing light, so the underlying mark also needs a strong, flat version.',
      ],
      [
        'Try freezing the highlight',
        'Compare a still at the brightest point with another at the darkest. Then hide the highlight entirely. The mark should remain identifiable in all three views. Select a still that also works for store listings and screenshots.',
      ],
    ],
    brief:
      'Our audio app needs a clear symbol on the Home Screen. Give it a glass treatment on supported devices and a solid version for our podcast artwork.',
  },
  {
    style: 'Spatial UI',
    slug: 'spatial-ui',
    brand: 'Apple Photos on visionOS',
    file: 'spatial-photos.webp',
    note: 'The petals sit in front of a round base. On a spatial display, separate layers give the icon depth as you look at it.',
    intro:
      'A spatial icon is built to be seen in layers. As the viewing angle changes, the foreground and background can appear to shift against each other. The distance between them becomes part of the design.',
    examples: [
      ['Apple Photos on visionOS', 'The petals form a recognisable foreground on a circular base.'],
      [
        'Apple Notes on visionOS',
        'The familiar yellow-topped note gives the eye a stable object to follow.',
      ],
      [
        'Apple Safari on visionOS',
        'The compass needle has a clear relationship to the dial behind it.',
      ],
    ],
    sections: [
      [
        'Give each layer a job',
        'Imagine a compass cut from paper: a backing circle, a dial and a needle. That order tells the viewer what to look at first. A designer leaves enough room around the front element for small shifts in perspective. Fine lettering close to the edge is easy to lose when layers move.',
      ],
      [
        'When depth adds meaning',
        'A navigation, visualisation or immersive product can make good use of an icon that feels like a small object in space. Its website, invoices and store listing still need a clear front-facing image. Work out that view first, then check what depth contributes when the icon is seen from an angle.',
      ],
      [
        'Try a paper model',
        'Cut three paper layers and separate them with folded card. Look straight ahead, then move slightly left and right. If the front layer hides the feature that identifies the middle one, enlarge the gap around that feature.',
      ],
    ],
    brief:
      'Our wayfinding tool should feel like an instrument. Build around a needle and dial that read both in a headset and as a still image on our website.',
  },
  {
    style: 'Flat design',
    slug: 'flat-design',
    brand: 'Microsoft',
    file: 'microsoft.svg',
    note: 'Four blocks of solid colour read clearly without highlights, shadows or perspective.',
    intro:
      'Flat logos use areas of solid colour to describe a shape. Without a highlight to separate two touching pieces, their proportions and the gaps between them have to do the work.',
    examples: [
      ['Microsoft', 'Four blocks of colour sit around a simple cross-shaped gap.'],
      ['Google Chrome’s flat icon', 'Broad coloured segments circle a contrasting blue centre.'],
      ['Slack', 'A repeating set of short bars and dots builds a multicoloured symbol.'],
    ],
    sections: [
      [
        'Give colour a purpose',
        'Assign each colour to a clear piece of the mark. A designer checks where pieces touch and how much contrast is available there. In Microsoft’s symbol, the narrow gap keeps the squares distinct. Without that space, colours of similar brightness could merge in a one-colour print.',
      ],
      [
        'Where it works well',
        'Flat artwork can move cleanly between a screen, a vinyl sign and a printed leaflet. A straightforward mark can still get lost among similar app icons. Build in a distinctive proportion or arrangement that survives even when the colours are removed.',
      ],
      [
        'Try the cut-paper test',
        'Make the logo from pieces of coloured paper, then photograph it in black and white. Can someone still count the pieces and recognise the overall shape? If two parts merge, adjust the gap before adding another colour.',
      ],
    ],
    brief:
      'Our delivery service needs a clear app icon and a van decal. Show the same arrangement in colour and cut from a single sheet of vinyl.',
  },
  {
    style: 'Geometric',
    slug: 'geometric',
    brand: 'Figma',
    file: 'figma.svg',
    note: 'Follow the circles and semicircles down the F. Their repeated curves make several colours feel like one family.',
    intro:
      'Circles, triangles and squares feel simple in isolation. A recognisable geometric logo comes from how those shapes meet: the curve they share, the gap between them or the angle that repeats.',
    examples: [
      ['Figma', 'A circle, semicircles and rounded ends fit into a compact F.'],
      ['Mitsubishi', 'Three diamonds meet at a point to create a larger three-way form.'],
      [
        'Mastercard',
        'Two overlapping circles turn a familiar pair of shapes into one recognisable relationship.',
      ],
    ],
    sections: [
      [
        'Find a rule worth repeating',
        'Pick a rule you can explain in a sentence. Perhaps every curve comes from the same circle, or three diamonds share one angle. A designer builds several arrangements within that rule and checks which has a distinctive outline. Small adjustments by eye matter: a mathematically centred circle can still look as if it is drifting.',
      ],
      [
        'What it says about a business',
        'Repeated proportions can suggest care, order and consistency. That can suit a fabrication studio, but rounded modules and lively colour can feel playful enough for a toy maker. A generic circle inside a square says little on its own. Look for a relationship tied to the business, such as two components that fit together.',
      ],
      [
        'Try rebuilding it',
        'Cut out the basic shapes and let someone rearrange them after seeing the logo for five seconds. Notice what they remember. If the only memorable part is a colour, try a stronger overlap or a more distinctive angle.',
      ],
    ],
    brief:
      'We manufacture interlocking panels. Use the joint between two parts as the basis for a mark that can also be cut into a metal plate.',
  },
  {
    style: 'Retro / Vintage',
    slug: 'retro-vintage',
    brand: 'Burger King',
    file: 'burger-king.svg',
    note: 'Rounded lettering fits between two bun shapes. The soft edges give the mark the warmth of an old diner sign.',
    intro:
      'A retro logo borrows the visual habits of a particular era. An enamel shop sign, a record sleeve and a paper soda label each suggest a different past. Pick a reference your customers would understand.',
    examples: [
      [
        'Burger King',
        'The rounded name sits between two bun shapes, like lettering on a diner sign.',
      ],
      ['Coca-Cola', 'The flowing script and long swashes recall hand-lettered packaging.'],
      [
        'Levi’s red tab',
        'A small woven label connects the identity to the physical history of denim workwear.',
      ],
    ],
    sections: [
      [
        'Choose a period and a reason',
        'A neighbourhood ice-cream shop might start with the lettering on a family’s old delivery van. That gives the design a reason for its curves and colours. The designer can redraw the lettering for modern use while keeping an unusual letter or spacing decision that makes it feel personal.',
      ],
      [
        'Keep the nostalgia usable',
        'Vintage character can suggest familiarity and craft. Artificial wear is less dependable: a distressed line on a large sign may become a grey smudge on a loyalty card. Build a clean master first. Add texture to the packaging or background so the logo can still print sharply.',
      ],
      [
        'Try the family-album test',
        'Put two historical references beside one contemporary rival. Point to the exact detail you want to borrow from the past, then one thing your customers still need today, such as a name that reads quickly on a phone.',
      ],
    ],
    brief:
      'Our family ice-cream shop has served the same street for years. Use the lettering rhythm from our old van and keep the name clear on a small takeaway cup.',
  },
  {
    style: 'Hand-drawn / Organic',
    slug: 'hand-drawn-organic',
    brand: 'Debian',
    file: 'debian.svg',
    note: 'The spiral has the broken edge of a brushstroke. Its small irregularities give it a human touch.',
    intro:
      'An uneven curve can carry the trace of the hand that made it. A dry-brush edge feels different from a flowing signature, even when both are printed from a digital file.',
    examples: [
      ['Debian', 'The spiral’s broken brush edge gives an abstract shape a human gesture.'],
      [
        'Disney',
        'The looping, signature-like wordmark turns the company name into a personal gesture.',
      ],
      [
        'Innocent Drinks',
        'The loosely drawn face and halo give a few simple lines an informal expression.',
      ],
    ],
    sections: [
      [
        'Keep one human detail',
        'Start with real pen, brush or pencil marks. When a designer turns a drawing into a digital outline, it is easy to smooth away its character. Pick the slight wobble, blunt stroke ending or uneven loop that carries the feeling you want. Simplify the marks around it.',
      ],
      [
        'Match the gesture to the work',
        'A florist’s loose stem drawing might suggest movement, while a cabinetmaker’s firm pencil signature can convey precision. Both feel personal. On a small woven label, tiny flecks may disappear, so keep a compact version with a heavier stroke.',
      ],
      [
        'Try the photocopy test',
        'Draw the name several times without tracing. Choose the version you would happily sign, photocopy it smaller and inspect the thinnest joins. Thicken a weak join before removing the slight irregularity that makes it yours.',
      ],
    ],
    brief:
      'We bind notebooks by hand. Keep the uneven loop in our founder’s signature and make sure it still prints clearly on the inside cover.',
  },
  {
    style: 'Typographic',
    slug: 'typographic',
    brand: 'IBM',
    file: 'ibm.svg',
    note: 'The letters carry the identity. Horizontal stripes run through all three, giving the name a rhythm of its own.',
    intro:
      'Sometimes the name itself is the most useful thing to remember. A typographic logo gives the letters a particular voice through their shapes, spacing, weight or rhythm.',
    examples: [
      ['IBM', 'Horizontal stripes carry one rhythm through three different letters.'],
      ['FedEx', 'The space between the E and x forms an arrow inside an otherwise readable name.'],
      [
        'Google',
        'Colour changes help separate letters while their rounded shapes hold the word together.',
      ],
    ],
    sections: [
      [
        'Read it before you decorate it',
        'A designer begins with the letters the business actually owns. A double letter might give a name a beat, or a distinctive capital might anchor a long word. Adjusting the space between one awkward pair can improve the whole mark. Read it aloud and check that a new customer sees the same word.',
      ],
      [
        'Choose a voice that fits the name',
        'Tall, tightly packed letters can give a venue a strong poster presence. Open counters, the spaces inside letters such as a or e, can make a longer name feel more relaxed. Decide how the name will fit on a narrow shopfront, a website header and a square avatar.',
      ],
      [
        'Try a quick reading test',
        'Show the wordmark at receipt size for two seconds to someone unfamiliar with your business. Ask them to spell it back. If the customised letter attracts attention but changes their reading, redraw that letter and test the pair around it.',
      ],
    ],
    brief:
      'Our name is unusual and people often misspell it. Make the word easy to read on a parcel label, with one letter we can also use as a profile icon.',
  },
  {
    style: 'Illustrative / Mascot',
    slug: 'illustrative-mascot',
    brand: 'Linux',
    file: 'linux.svg',
    note: 'Tux gives a software project a face. A seated pose and rounded belly make the penguin feel approachable.',
    intro:
      'A mascot gives customers someone to recognise. Its pose, expression and silhouette can communicate friendliness or expertise before a person knows what the business does.',
    examples: [
      ['Linux', 'Tux’s seated pose and rounded belly give the penguin a relaxed personality.'],
      ['Duolingo', 'Duo’s large eyes make an expression readable on a small screen.'],
      ['Michelin', 'The Michelin Man’s stacked tyre shapes link the character to the product.'],
    ],
    sections: [
      [
        'Choose a role for the character',
        'Is this character a guide, a maker or a mischievous companion? A guide might lean towards the viewer. A dependable expert might stand squarely. Sketch a few poses before adding clothing or facial detail. If you can tell which character it is from the outline, you have something sturdy to build on.',
      ],
      [
        'Give it a range of expressions',
        'A mascot can welcome a customer on a sign and offer help on a screen. Think through a difficult moment too. The expression that suits a celebration may feel insensitive beside a delayed order. Agree on a small set of poses and a head-only version for compact spaces.',
      ],
      [
        'Try the silhouette line-up',
        'Put three character sketches in a row and fill them in black. Ask someone which seems most helpful or most energetic, and what in the pose led them there. Then see whether its face alone works at avatar size.',
      ],
    ],
    brief:
      'Our bicycle workshop wants a helpful guide for first-time riders. Develop a character that feels patient on a repair notice and lively on a children’s workshop poster.',
  },
  {
    style: 'Luxury / Elegant',
    slug: 'luxury-elegant',
    brand: 'Chanel',
    file: 'chanel.svg',
    note: 'Bold capitals stand on a single line with carefully spaced gaps. The spare lettering gives the name a composed, formal presence.',
    intro:
      'An elegant identity often feels unhurried. There is room around the name, the proportions feel deliberate and the material it sits on has a chance to speak.',
    examples: [
      [
        'Chanel',
        'Evenly weighted capitals and measured spacing give the name a composed presence.',
      ],
      ['Cartier', 'Fine script and long joins suggest a pen moving across the page.'],
      [
        'Dior',
        'The thick and thin parts of the serif letters create a different kind of refinement.',
      ],
    ],
    sections: [
      [
        'Decide what deserves attention',
        'Luxury can be expressed through very different letters. Chanel’s strong capitals and Cartier’s script do not sound alike. Choose whether your business should feel architectural, intimate or traditional. A designer can then tune the space around the name, the weight of its strokes and the rhythm between letters.',
      ],
      [
        'Design for the material',
        'A fine line that looks beautiful in a screen preview may fill in when foil is pressed into textured paper. Ask your printer for a sample on the intended stock. For a small metal fitting or a care label, a slightly sturdier drawing may look more refined in use than the delicate master artwork.',
      ],
      [
        'Try removing the finish',
        'Print the logo in plain black on ordinary paper, then set it on a generously spaced card. If the lettering still has character, a foil or emboss can add another layer. If the gold finish is doing all the work, revisit the letterforms first.',
      ],
    ],
    brief:
      'Our jeweller’s mark will appear on a ring box and a tiny care card. We want a quiet, contemporary feel and a version that survives a blind emboss.',
  },
  {
    style: 'Abstract',
    slug: 'abstract',
    brand: 'Airbnb',
    file: 'airbnb.svg',
    note: 'One continuous loop suggests several things at once. A viewer can recognise the outline before deciding what it means.',
    intro:
      'An abstract logo gives a business a shape it can make familiar over time. The shape may suggest an idea such as connection, direction or exchange without drawing the product itself.',
    examples: [
      ['Airbnb', 'A continuous rounded loop leaves room for several readings.'],
      ['Chase', 'Four angled pieces surround a square opening to form an octagonal symbol.'],
      [
        'Nike',
        'A single tapered stroke can suggest movement without depicting a runner or a shoe.',
      ],
    ],
    sections: [
      [
        'Start with an action',
        'Instead of asking for a shape that means “technology”, describe something the business does. Does it join, divide, guide or protect? A designer can sketch verbs: two paths meet, a line turns, a form opens. Choose the sketch with a clear silhouette and a useful connection to the work.',
      ],
      [
        'Allow time for recognition',
        'An abstract symbol can move with a business as its services change. Customers will usually learn its meaning through repeated contact with the name and the experience behind it. For a new company, plan a name-and-symbol arrangement first and reserve the symbol alone for places where the name is already visible.',
      ],
      [
        'Try the five-second sketch',
        'Show the symbol briefly, hide it and ask someone to draw it. They may describe a different meaning from the one you intended. What matters first is whether they remember the same turn, opening or proportion that makes the shape distinctive.',
      ],
    ],
    brief:
      'We connect independent shops with local suppliers. Explore two paths meeting, and show the symbol beside our full name on a shop window sticker.',
  },
];

const references = [...designGuides, minimalistExample];
export const logoStyles = brandingDesignQuestion.options!.flatMap((option) => {
  const reference = references.find(({ style }) => style === option);
  return reference ? [reference] : [];
});
