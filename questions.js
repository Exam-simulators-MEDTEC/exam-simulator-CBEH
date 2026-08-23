const questions = [
  // PART I: CELL BIOLOGY (30 Questions, Q1 to Q30)
  {
    id: 1,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "Which of the following transport mechanisms relies directly on the hydrolysis of ATP to move ions across the plasma membrane against their concentration gradient?",
    options: [
      "A. Secondary active transport via symporters",
      "B. Facilitated diffusion via carrier proteins",
      "C. Primary active transport via the Na+/K+ pump",
      "D. Osmosis through aquaporins",
      "E. Ion channel-coupled receptor transport"
    ],
    correctAnswer: "C",
    explanation: "Primary active transport mechanisms, such as the Na+/K+ ATPase pump, use energy derived directly from the hydrolysis of ATP to transport solutes against their electrochemical gradient."
  },
  {
    id: 2,
    type: "true-false",
    module: "Cell Biology",
    question: "Intermediate filaments exhibit rapid dynamic instability and treadmilling, making them the primary cytoskeletal element responsible for chromosome segregation during mitosis.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "Microtubules, not intermediate filaments, exhibit dynamic instability and treadmilling, and form the mitotic spindle responsible for chromosome segregation during mitosis. Intermediate filaments provide mechanical strength and are relatively stable."
  },
  {
    id: 3,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "Which cellular compartment is primarily responsible for the sorting and modification of proteins destined for the lysosome, utilizing mannose-6-phosphate (M6P) tags?",
    options: [
      "A. Early Endosome",
      "B. Smooth Endoplasmic Reticulum",
      "C. Peroxisome",
      "D. Trans-Golgi Network (TGN)",
      "E. Nucleolus"
    ],
    correctAnswer: "D",
    explanation: "The Trans-Golgi Network (TGN) is responsible for sorting proteins destined for lysosomes, recognizing the mannose-6-phosphate (M6P) signal tag added to these proteins."
  },
  {
    id: 4,
    type: "open",
    module: "Cell Biology",
    question: "Briefly describe the structure of ribosomes, their function and localization in cells. (Max 200 words)",
    modelAnswer: "Ribosomes are large ribonucleoprotein complexes composed of two unequal subunits: a large subunit (60S in eukaryotes) and a small subunit (40S in eukaryotes). They are made of ribosomal RNA (rRNA) molecules and numerous ribosomal proteins. Their primary function is to catalyze protein synthesis (translation), linking amino acids together via peptide bonds in the order specified by messenger RNA (mRNA). In cells, ribosomes can be found localized free in the cytosol, where they synthesize intracellular proteins, or bound to the membrane of the rough endoplasmic reticulum (RER) and the outer nuclear membrane, where they synthesize membrane-bound, lysosomal, or secreted proteins. They are also present inside mitochondria and chloroplasts.",
    explanation: "Must cover: subunits (large/small), composition (rRNA + proteins), translation function, and dual localization (free in cytosol vs. bound to rough ER)."
  },
  {
    id: 5,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "Which protein gives shape and stability to the nuclear envelope?",
    options: [
      "A. Lamin B",
      "B. Desmin",
      "C. Tubulin",
      "D. Actin",
      "E. Importin"
    ],
    correctAnswer: "A",
    explanation: "Nuclear lamins (such as Lamin A, B, and C) form the nuclear lamina, a fibrous meshwork on the inner aspect of the nuclear envelope that provides structural support and shape to the nucleus."
  },
  {
    id: 6,
    type: "open",
    module: "Cell Biology",
    question: "Briefly describe the physico-chemical properties of the DNA double helix that allow it to be denatured (melted) and renatured (annealed). Mention the specific bonds involved. (Max 200 words)",
    modelAnswer: "The DNA double helix is held together by two main types of chemical bonds: covalent phosphodiester bonds that link the nucleotide backbone within each strand, and non-covalent hydrogen bonds that pair complementary nitrogenous bases between the two strands (two hydrogen bonds between Adenine and Thymine; three between Guanine and Cytosine). The non-covalent hydrogen bonds are weak and easily disrupted by heat or alkaline pH, allowing the two strands to separate (denature or melt) without breaking the strong covalent backbone. When the temperature is lowered or pH neutralized, complementary base pairing allows the strands to spontaneously re-associate and reform the double helix (renaturation or annealing). Hydrophobic stacking forces between base pairs also stabilize the helical structure and contribute to this dynamic reversibility.",
    explanation: "Must mention: covalent phosphodiester bonds (strong backbone), hydrogen bonds (weak, 2 for A-T, 3 for G-C), how heat/pH disrupts hydrogen bonds for denaturation, and how cooling/neutralization allows annealing."
  },
  {
    id: 7,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "The fundamental repeating unit of chromatin, consisting of approximately 147 base pairs of DNA wrapped around an octamer of core histones, is called a:",
    options: [
      "A. Solenoid",
      "B. Chromatosome",
      "C. Telomere",
      "D. Centromere",
      "E. Nucleosome"
    ],
    correctAnswer: "E",
    explanation: "The nucleosome is the basic structural unit of DNA packaging in eukaryotes, consisting of DNA wrapped ~1.67 times around a core octamer of histones (two each of H2A, H2B, H3, and H4)."
  },
  {
    id: 8,
    type: "true-false",
    module: "Cell Biology",
    question: "Telomerase is a specialized reverse transcriptase that carries its own RNA template to solve the end-replication problem in eukaryotic linear chromosomes.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Telomerase uses its intrinsic RNA component (TERC) as a template to synthesize telomeric repeat sequences (TTAGGG) at the 3' ends of linear chromosomes, compensating for replication-induced shortening."
  },
  {
    id: 9,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "During eukaryotic transcription, which general transcription factor contains the TATA-binding protein (TBP) necessary for promoter recognition?",
    options: [
      "A. TFIIB",
      "B. TFIID",
      "C. TFIIH",
      "D. TFIIE",
      "E. TFIIA"
    ],
    correctAnswer: "B",
    explanation: "TFIID is composed of TBP (TATA-binding protein) and TAFs (TBP-associated factors). It binds directly to the TATA box promoter element to initiate pre-initiation complex assembly."
  },
  {
    id: 10,
    type: "open",
    module: "Cell Biology",
    question: "Describe the process of RNA splicing, including the roles of introns, exons, and the spliceosome. (Max 200 words)",
    modelAnswer: "RNA splicing is a critical post-transcriptional modification in eukaryotes where precursor messenger RNA (pre-mRNA) is converted into mature mRNA. Introns (non-coding sequences) are removed, and exons (coding sequences) are precisely joined together. This process is catalyzed by the spliceosome, a large ribonucleoprotein complex composed of five small nuclear RNAs (snRNAs U1, U2, U4, U5, and U6) complexed with proteins to form small nuclear ribonucleoproteins (snRNPs). The spliceosome recognizes specific consensus sequences at the 5' splice site, the 3' splice site, and an internal branch point. It performs two sequential transesterification reactions, excising the intron as a lariat structure and ligating the adjacent exons. Alternative splicing allows different combinations of exons to be joined, producing multiple protein isoforms from a single gene.",
    explanation: "Must mention: intron removal, exon ligation, spliceosome composition (snRNAs/snRNPs), transesterification chemistry (lariat structure), and biological significance (mature mRNA, protein diversity via alternative splicing)."
  },
  {
    id: 11,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "Which property of the genetic code explains why a single amino acid can be encoded by more than one synonymous codon?",
    options: [
      "A. Universality",
      "B. Non-overlapping nature",
      "C. Redundancy (Degeneracy)",
      "D. Unambiguity",
      "E. Polarity"
    ],
    correctAnswer: "C",
    explanation: "Redundancy (or degeneracy) means that multiple codons can code for the same amino acid (e.g., six different codons code for Leucine). Unambiguity means that each single codon codes for only one amino acid."
  },
  {
    id: 12,
    type: "matching",
    module: "Cell Biology",
    question: "Match the chaperone/protein-folding concept with its correct description.",
    leftItems: [
      "1. HSP70",
      "2. HSP60 (Chaperonin)",
      "3. Proteasome",
      "4. Ubiquitin"
    ],
    rightItems: [
      "A. A small polypeptide tag that marks misfolded proteins for destruction.",
      "B. Forms a barrel-like isolation chamber for proteins to fold without aggregation.",
      "C. A multi-subunit protease complex that degrades tagged proteins.",
      "D. Binds to exposed hydrophobic regions of nascent polypeptides co-translationally."
    ],
    correctAnswers: { 0: 3, 1: 1, 2: 2, 3: 0 },
    explanation: "1-D: HSP70 binds to exposed hydrophobic regions co-translationally. 2-B: HSP60 forms an isolation chamber (chaperonin) for folding. 3-C: The proteasome degrades tagged proteins. 4-A: Ubiquitin marks proteins for destruction."
  },
  {
    id: 13,
    type: "open",
    module: "Cell Biology",
    question: "Describe the molecular signal and mechanism required for the transport of proteins into the nucleus. (Max 200 words)",
    modelAnswer: "Proteins destined for the nucleus must possess a specific molecular tag called a Nuclear Localization Signal (NLS), which typically consists of one or two short sequences rich in positively charged lysine and arginine residues. The NLS is recognized in the cytoplasm by importin receptors (importin-alpha and importin-beta). This cargo-receptor complex binds to and translocates through the nuclear pore complex (NPC) via interactions with FG-repeat nucleoporins. Inside the nucleus, the small GTPase Ran in its GTP-bound state (Ran-GTP) binds to importin, causing a conformational change that releases the cargo protein. The Ran-GTP-importin complex is then exported back to the cytoplasm, where RanGAP hydrolyzes GTP to GDP, releasing the importin receptor for another cycle of transport.",
    explanation: "Must mention: Nuclear Localization Signal (NLS) characteristics, importin receptors, translocation through the nuclear pore complex, and the role of Ran-GTP/Ran-GDP gradient in cargo release and recycling."
  },
  {
    id: 14,
    type: "true-false",
    module: "Cell Biology",
    question: "In G-protein coupled receptor (GPCR) signaling, the activation of the receptor causes the alpha subunit of the G-protein to exchange GDP for GTP.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Upon ligand binding, the GPCR acts as a Guanine Nucleotide Exchange Factor (GEF), inducing a conformational change in the heterotrimeric G-protein that prompts the alpha subunit to release GDP and bind GTP, leading to dissociation and downstream activation."
  },
  {
    id: 15,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "During which phase of mitosis do sister chromatids separate and begin to migrate toward opposite spindle poles?",
    options: [
      "A. Prophase",
      "B. Metaphase",
      "C. Telophase",
      "D. Anaphase",
      "E. Prometaphase"
    ],
    correctAnswer: "D",
    explanation: "During anaphase, the enzyme separase cleaves cohesin proteins holding sister chromatids together, allowing kinetochore microtubules to pull them toward opposite poles of the cell."
  },
  {
    id: 16,
    type: "fill-in-the-gap",
    module: "Cell Biology",
    question: "The critical cell cycle checkpoint located at the G1/S transition, which determines whether a cell commits to DNA replication in response to mitogens, is known as the ________ point.",
    options: [
      "Restriction",
      "Metaphase",
      "G2/M",
      "Apoptosis"
    ],
    correctAnswer: "Restriction",
    explanation: "The Restriction point (R point) in mammalian cells (or START in yeast) is the checkpoint in late G1 phase where the cell commits to division. Beyond this point, the cell no longer requires extracellular mitogenic signals to complete the cell cycle."
  },
  {
    id: 17,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "Which of the following events is exclusive to Meiosis I and does NOT occur in Meiosis II or Mitosis?",
    options: [
      "A. Condensation of chromatin into visible chromosomes",
      "B. Homologous recombination (crossing-over) at chiasmata",
      "C. Alignment of chromosomes at the metaphase plate",
      "D. Separation of sister chromatids",
      "E. Breakdown of the nuclear envelope"
    ],
    correctAnswer: "B",
    explanation: "Homologous recombination (crossing-over) and the pairing of homologous chromosomes (synapsis) occur exclusively during Prophase I of Meiosis I. Mitosis and Meiosis II involve separating sister chromatids without homologous pairing."
  },
  {
    id: 18,
    type: "open",
    module: "Cell Biology",
    question: "Differentiate between the intrinsic and extrinsic pathways of apoptosis, specifically naming the key initiating caspases for each. (Max 200 words)",
    modelAnswer: "Apoptosis occurs via two distinct pathways. The intrinsic (mitochondrial) pathway is triggered by intracellular stress (e.g., DNA damage, oxidative stress). This leads to outer mitochondrial membrane permeabilization (MOMP) regulated by Bcl-2 family proteins, causing the release of Cytochrome c into the cytosol. Cytochrome c binds Apaf-1 and dATP to assemble the apoptosome, which recruits and activates the initiator Caspase-9. The extrinsic (death receptor) pathway is triggered by extracellular death ligands (e.g., FasL, TNF-alpha) binding to transmembrane death receptors. This recruits adaptor proteins (e.g., FADD) to form the Death-Inducing Signaling Complex (DISC), which recruits and cleaves the initiator Caspase-8 (or Caspase-10). Both pathways converge on activating downstream executioner caspases, such as Caspase-3, -6, and -7, which carry out proteolytic cleavage and cell destruction.",
    explanation: "Must specify: Intrinsic triggers (internal stress, Cytochrome c, apoptosome, initiating Caspase-9) vs. Extrinsic triggers (extracellular ligands, death receptors, DISC, initiating Caspase-8), converging on executioner caspases like Caspase-3."
  },
  {
    id: 19,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "Which of the following describes the structure of a retrovirus genome, such as HIV?",
    options: [
      "A. Double-stranded DNA",
      "B. Single-stranded negative-sense RNA",
      "C. Double-stranded RNA",
      "D. Circular double-stranded DNA",
      "E. Single-stranded positive-sense RNA"
    ],
    correctAnswer: "E",
    explanation: "Retroviruses like HIV contain two identical copies of single-stranded positive-sense RNA (+ssRNA) genomes, which are converted into double-stranded DNA inside the host cell via reverse transcription."
  },
  {
    id: 20,
    type: "true-false",
    module: "Cell Biology",
    question: "Induced pluripotent stem cells (iPSCs) are derived by reprogramming adult somatic cells using a specific set of transcription factors (e.g., Yamanaka factors).",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "iPSCs are generated directly from adult somatic tissues by introducing four key transcription factors (Oct3/4, Sox2, Klf4, and c-Myc), known as the Yamanaka factors."
  },
  {
    id: 21,
    type: "open",
    module: "Cell Biology",
    question: "Explain the role and mechanism of the Cas9 protein and guide RNA (gRNA) in the CRISPR-Cas9 genome editing system. (Max 200 words)",
    modelAnswer: "The CRISPR-Cas9 system is a powerful tool for targeted genome editing. The Cas9 protein functions as a molecular endonuclease that introduces double-strand breaks (DSBs) in DNA. It is guided to a specific genomic locus by the guide RNA (gRNA), which is engineered to contain a 20-nucleotide spacer sequence complementary to the target DNA site. For Cas9 to bind and cleave, the target sequence must be immediately adjacent to a Protospacer Adjacent Motif (PAM), typically 5'-NGG-3'. Upon binding, Cas9 unwinds the DNA, the gRNA hybridizes with the target strand, and Cas9's HNH and RuvC endonuclease domains cleave both strands of the DNA. The host cell then repairs this double-strand break using either error-prone Non-Homologous End Joining (NHEJ), which can disrupt genes, or Homology-Directed Repair (HDR) to introduce specific sequence modifications.",
    explanation: "Must cover: Cas9 endonuclease function, gRNA target recognition by sequence complementarity, importance of the PAM sequence, and double-strand break repair pathways (NHEJ or HDR)."
  },
  {
    id: 22,
    type: "fill-in-the-gap",
    module: "Cell Biology",
    question: "Unlike eukaryotic cells, prokaryotic cells lack a membrane-bound ________ to house their genetic material.",
    options: [
      "Nucleus",
      "Nucleoid",
      "Ribosome",
      "Mitochondrion"
    ],
    correctAnswer: "Nucleus",
    explanation: "Prokaryotes lack a membrane-bound nucleus; their genetic material is localized in an irregular, non-membrane-enclosed region of the cytoplasm called the nucleoid."
  },
  {
    id: 23,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "A frameshift mutation is most likely to result from which of the following alterations to the DNA sequence?",
    options: [
      "A. A single base substitution from a purine to a pyrimidine",
      "B. A silent mutation in the third position of a codon",
      "C. An insertion or deletion of a number of nucleotides not divisible by three",
      "D. The precise deletion of exactly three consecutive nucleotides"
    ],
    correctAnswer: "C",
    explanation: "Since codons are read in groups of three nucleotides, inserting or deleting a number of bases not divisible by three shifts the reading frame of all subsequent codons, altering the downstream amino acid sequence."
  },
  {
    id: 24,
    type: "true-false",
    module: "Cell Biology",
    question: "Prion diseases are caused by the transmission of misfolded proteins that induce normal versions of the same protein to adopt the pathological, aggregation-prone beta-sheet conformation.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Prions propagate by inducing the normal cellular prion protein (PrPC, predominantly alpha-helical) to refold into the scrapie isoform (PrPSc, rich in beta-sheets), which aggregates and causes neurodegeneration."
  },
  {
    id: 25,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "Which second messenger is directly produced by the enzyme adenylyl cyclase upon GPCR activation?",
    options: [
      "A. Inositol triphosphate (IP_3)",
      "B. Diacylglycerol (DAG)",
      "C. Calcium ions (Ca^2+)",
      "D. Cyclic AMP (cAMP)",
      "E. Nitric oxide (NO)"
    ],
    correctAnswer: "D",
    explanation: "Activated Gs-alpha subunits stimulate adenylyl cyclase, which converts ATP into the second messenger cyclic AMP (cAMP). IP3 and DAG are products of phospholipase C activity."
  },
  {
    id: 26,
    type: "open",
    module: "Cell Biology",
    question: "Briefly explain the functional difference between a proto-oncogene and a tumor suppressor gene in the context of cancer progression. (Max 200 words)",
    modelAnswer: "Proto-oncogenes and tumor suppressor genes are two classes of genes that regulate cell growth. Proto-oncogenes normally encode proteins that promote cell proliferation, growth, and survival (e.g., Ras, Myc). Gain-of-function mutations in these genes convert them into oncogenes, which act in a dominant fashion (requiring only one mutated allele) to drive unchecked cellular proliferation, akin to an stuck accelerator. Conversely, tumor suppressor genes normally encode proteins that inhibit the cell cycle, repair DNA damage, or promote apoptosis (e.g., p53, Rb). Loss-of-function mutations in these genes remove these safety brakes. These mutations act in a recessive fashion (requiring both alleles to be inactivated, as in Knudson's two-hit hypothesis) to permit cancer progression. Thus, oncogenes drive cell division, while inactive tumor suppressors fail to halt it.",
    explanation: "Must contrast: Proto-oncogenes (normally stimulate growth, gain-of-function mutations become oncogenes, dominant) vs. Tumor suppressor genes (normally inhibit growth/repair DNA, loss-of-function mutations remove brakes, recessive/two-hit)."
  },
  {
    id: 27,
    type: "fill-in-the-gap",
    module: "Cell Biology",
    question: "In the intrinsic apoptotic pathway, the release of cytochrome c from mitochondria triggers the assembly of a multi-protein complex called the ________, which activates Caspase-9.",
    options: [
      "Apoptosome",
      "Proteasome",
      "Spliceosome",
      "Centrosome"
    ],
    correctAnswer: "Apoptosome",
    explanation: "Released Cytochrome c binds to Apaf-1 in the presence of dATP, assembling a heptameric wheel-like complex called the apoptosome, which acts as a platform to activate the initiator Caspase-9."
  },
  {
    id: 28,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "A point mutation that changes a codon specifying an amino acid into a premature STOP codon is classified as a:",
    options: [
      "A. Missense mutation",
      "B. Silent mutation",
      "C. Splice-site mutation",
      "D. Frameshift mutation",
      "E. Nonsense mutation"
    ],
    correctAnswer: "E",
    explanation: "A nonsense mutation creates a premature translation termination codon (UAA, UAG, UGA), leading to truncated, often nonfunctional proteins."
  },
  {
    id: 29,
    type: "true-false",
    module: "Cell Biology",
    question: "Clathrin-mediated endocytosis is a receptor-independent, non-specific form of bulk transport (pinocytosis).",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "Clathrin-mediated endocytosis is a highly specific, receptor-mediated process where target ligands bind specific cell-surface receptors, which concentrate in clathrin-coated pits before internalizing."
  },
  {
    id: 30,
    type: "multiple-choice",
    module: "Cell Biology",
    question: "Which of the following best describes an 'organoid'?",
    options: [
      "A. A single layer of stem cells grown in a 2D petri dish.",
      "B. A 3D miniaturized and simplified in vitro version of an organ produced from stem cells.",
      "C. An isolated cellular organelle, such as a mitochondrion, maintained in vitro.",
      "D. A fully mature organ transplanted from an animal model into a human.",
      "E. A synthetic scaffold used for bone grafts."
    ],
    correctAnswer: "B",
    explanation: "Organoids are 3D, multicellular, self-organizing structures grown in vitro from stem cells that recapitulate the cellular complexity, structure, and basic functions of their corresponding in vivo organs."
  },

  // PART II: HISTOLOGY (24 Questions, Q31 to Q54)
  {
    id: 31,
    type: "multiple-choice",
    module: "Histology",
    question: "During standard histological tissue preparation, what is the primary purpose of the fixation step (e.g., using formalin)?",
    options: [
      "A. To remove water from the tissue prior to embedding.",
      "B. To provide structural support for thin sectioning.",
      "C. To preserve tissue structure and prevent autolysis and putrefaction.",
      "D. To impart color contrast to the tissue structures for microscopy.",
      "E. To clear the lipids from adipose tissue."
    ],
    correctAnswer: "C",
    explanation: "Fixation cross-links proteins and inactivates enzymes, arresting autolysis, preventing bacterial degradation (putrefaction), and preserving the structural architecture of cells and tissues close to their living state."
  },
  {
    id: 32,
    type: "open",
    module: "Histology",
    question: "Describe the structure and function of tight junctions (zonula occludens) in epithelial tissues. (Max 200 words)",
    modelAnswer: "Tight junctions (zonula occludens) are the most apical type of cell junction found in epithelial cell sheets. They consist of transmembrane proteins, primarily claudins and occludins, that project from adjacent plasma membranes and interlace to form a continuous, branching network of sealing strands. Intracellularly, these proteins interact with zo-1, zo-2, and zo-3 adaptor proteins, which anchor them to the actin cytoskeleton. Tight junctions serve two main functions: a barrier (or gate) function that regulates paracellular diffusion of water, ions, and solutes between cells; and a fence function that prevents the lateral diffusion of membrane lipids and proteins, maintaining the structural and functional polarity of the apical and basolateral domains.",
    explanation: "Must mention: apical location, claudins/occludins proteins, anchoring to actin via ZO proteins, and dual functions (barrier/gate function for paracellular transport and fence function for cell polarity)."
  },
  {
    id: 33,
    type: "multiple-choice",
    module: "Histology",
    question: "A histological section reveals a single layer of cells that are taller than they are wide, with oval nuclei located near the basal domain. This epithelium is classified as:",
    options: [
      "A. Simple squamous epithelium",
      "B. Stratified squamous epithelium",
      "C. Pseudostratified ciliated epithelium",
      "D. Transitional epithelium",
      "E. Simple columnar epithelium"
    ],
    correctAnswer: "E",
    explanation: "Simple columnar epithelium is defined by a single layer (simple) of tall, rectangular cells (columnar) with vertically oriented nuclei located in the basal portion of the cell."
  },
  {
    id: 34,
    type: "true-false",
    module: "Histology",
    question: "Merocrine secretion involves the release of secretory products via exocytosis with no loss of cytoplasm or plasma membrane.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "Merocrine (or eccrine) secretion releases granules by membrane fusion and exocytosis, keeping the cell intact. Apocrine secretion involves pinching off the apical cytoplasm, and holocrine secretion involves total cell lysis."
  },
  {
    id: 35,
    type: "open",
    module: "Histology",
    question: "Compare endocrine and exocrine glands in terms of structure, secretion pathways, and products. (Max 200 words)",
    modelAnswer: "Endocrine and exocrine glands differ fundamentally in structure and how they deliver their products. Exocrine glands maintain a structural connection to the epithelial surface of origin via a system of ducts (which can be simple or compound). They secrete their products (e.g., enzymes, mucus, sweat) onto an epithelial surface or into a lumen. In contrast, endocrine glands lose their connection to the surface during development and lack ducts. They are highly vascularized and secrete their products, called hormones (e.g., insulin, thyroid hormone), directly into the interstitial fluid, where they enter the bloodstream to act on distant target tissues. Cellularly, exocrine cells exhibit strong apical-basal polarity with secretory granules stored apically, whereas endocrine cells release hormones across their basolateral membranes toward adjacent capillaries.",
    explanation: "Must contrast: Exocrine glands (ducts, secrete products onto surface, local effect) vs. Endocrine glands (ductless, highly vascularized, secrete hormones into blood, systemic effect)."
  },
  {
    id: 36,
    type: "open",
    module: "Histology",
    question: "Describe the composition of the Extracellular Matrix (ECM) in connective tissue proper. Include both fibrous components and ground substance. (Max 200 words)",
    modelAnswer: "The extracellular matrix (ECM) of connective tissue proper consists of fibrous proteins embedded in an amorphous, hydrated ground substance. The fibrous components include: collagen fibers (predominantly Type I for tensile strength, and Type III forming delicate reticular networks) and elastic fibers (composed of elastin and fibrillin, providing elasticity and recoil). The ground substance is a highly hydrated gel composed of three main classes of macromolecules: Glycosaminoglycans (GAGs, e.g., hyaluronan, chondroitin sulfate) which are highly negatively charged and attract water; Proteoglycans (GAGs covalently linked to a core protein, like aggrecan) which resist compression; and multiadhesive Glycoproteins (e.g., fibronectin, laminin) which bind cells to the ECM via integrin receptors. This dual-component structure allows the tissue to resist both tensile and compressive physical forces.",
    explanation: "Must include: Fibrous components (collagen types, elastic/reticular fibers) and Ground substance components (GAGs, proteoglycans, multiadhesive glycoproteins like fibronectin)."
  },
  {
    id: 37,
    type: "multiple-choice",
    module: "Histology",
    question: "Which morphological feature strongly distinguishes brown adipose tissue from white adipose tissue?",
    options: [
      "A. Multiple small lipid droplets and a high density of mitochondria.",
      "B. A single, large lipid droplet pushing the nucleus to the periphery.",
      "C. An extensive network of dense regular collagen fibers.",
      "D. The complete absence of vascularization.",
      "E. The presence of intercalated discs."
    ],
    correctAnswer: "A",
    explanation: "White adipocytes are unilocular (one large lipid droplet, peripheral flat nucleus), while brown adipocytes are multilocular (multiple small lipid droplets, central spherical nucleus) and contain abundant mitochondria with UCP-1 for thermogenesis."
  },
  {
    id: 38,
    type: "fill-in-the-gap",
    module: "Histology",
    question: "The specialized cells responsible for synthesizing the extracellular matrix of cartilage and residing within lacunae are called ________.",
    options: [
      "Chondrocytes",
      "Osteoblasts",
      "Fibroblasts",
      "Osteoclasts"
    ],
    correctAnswer: "Chondrocytes",
    explanation: "Chondrocytes are the mature cells of cartilage. They reside in small cavities within the matrix called lacunae, maintaining the surrounding proteoglycans and collagen fibers."
  },
  {
    id: 39,
    type: "multiple-choice",
    module: "Histology",
    question: "Identify the INCORRECT statement regarding bone tissue histology and growth:",
    options: [
      "A. During development, cartilage grows by interstitial and appositional mechanisms.",
      "B. Volkmann's canals connect osteocyte lacunae with haversian canals.",
      "C. The osteoid is the unmineralized, organic portion of the bone matrix that forms prior to the maturation of bone tissue.",
      "D. The periosteum and endosteum contain osteoprogenitor cells.",
      "E. The degradation activity of osteoclasts is stimulated by parathyroid hormone and inhibited by calcitonin."
    ],
    correctAnswer: "B",
    explanation: "Statement B is incorrect. Volkmann's canals (transverse canals) connect Haversian canals (longitudinal canals) to each other and to the periosteum/endosteum. It is canaliculi (tiny micro-channels) that connect osteocyte lacunae to each other and to Haversian canals."
  },
  {
    id: 40,
    type: "multiple-choice",
    module: "Histology",
    question: "Which cell type is responsible for the production and secretion of insulin in the pancreas?",
    options: [
      "A. Acinar cell",
      "B. Islet cell",
      "C. Alpha cell",
      "D. Beta cell",
      "E. Delta cell"
    ],
    correctAnswer: "D",
    explanation: "Beta cells, located primarily in the core of the islets of Langerhans in the endocrine pancreas, synthesize and secrete insulin. Alpha cells secrete glucagon; delta cells secrete somatostatin."
  },
  {
    id: 41,
    type: "multiple-choice",
    module: "Histology",
    question: "In a lymph node, where are B-cell rich lymphoid follicles (nodules) primarily located?",
    options: [
      "A. Medullary cords",
      "B. Paracortex",
      "C. Outer cortex",
      "D. Subcapsular sinus",
      "E. Trabeculae"
    ],
    correctAnswer: "C",
    explanation: "Lymph nodes are organized into cortex and medulla. The outer cortex contains spherical lymphoid nodules which are rich in B-lymphocytes. The paracortex (deep cortex) is rich in T-lymphocytes."
  },
  {
    id: 42,
    type: "fill-in-the-gap",
    module: "Histology",
    question: "The fundamental contractile unit of skeletal muscle, bounded by two Z-discs, is the ________.",
    options: [
      "Sarcomere",
      "Myofibril",
      "Sarcoplasmic reticulum",
      "Sarcolemma"
    ],
    correctAnswer: "Sarcomere",
    explanation: "A sarcomere is the segment of a myofibril between two successive Z-lines. It contains overlapping thin (actin) and thick (myosin) filaments that slide past each other during contraction."
  },
  {
    id: 43,
    type: "open",
    module: "Histology",
    question: "Detail the histological and structural characteristics that distinguish smooth muscle from skeletal and cardiac muscle. (Max 200 words)",
    modelAnswer: "Smooth muscle can be distinguished histologically from skeletal and cardiac muscle by several features. Unlike skeletal and cardiac muscle, smooth muscle is non-striated because its actin and myosin filaments are not organized into sarcomeres; instead, they anchor to dense bodies in the cytoplasm and plasma membrane. Smooth muscle cells are small, spindle-shaped (fusiform) fibers, each containing a single, centrally located, cigar-shaped nucleus. In contrast, skeletal muscle cells are large, long, multinucleated cylinders with peripheral nuclei, and cardiac cells are branched, single-nucleated cylinders joined by intercalated discs. Furthermore, smooth muscle lacks T-tubules (utilizing caveolae instead) and is under involuntary control by the autonomic nervous system, whereas skeletal muscle is under voluntary somatic control and cardiac muscle is involuntary and autorhythmic.",
    explanation: "Must mention: lack of striations/sarcomeres (dense bodies instead), spindle/fusiform shape, single central cigar-shaped nucleus, autonomic control, and contrast with multinucleated skeletal and branched cardiac muscle."
  },
  {
    id: 44,
    type: "true-false",
    module: "Histology",
    question: "In the peripheral nervous system (PNS), the myelin sheath is formed by oligodendrocytes.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "In the peripheral nervous system (PNS), the myelin sheath is formed by Schwann cells. Oligodendrocytes form the myelin sheath in the central nervous system (CNS)."
  },
  {
    id: 45,
    type: "multiple-choice",
    module: "Histology",
    question: "Which glial cell type acts as the resident macrophage of the central nervous system (CNS), responsible for phagocytosis and immune defense?",
    options: [
      "A. Microglia",
      "B. Astrocyte",
      "C. Ependymal cell",
      "D. Schwann cell",
      "E. Satellite cell"
    ],
    correctAnswer: "A",
    explanation: "Microglia are phagocytic immune cells derived from yolk sac macrophage progenitors. They patrol the CNS parenchyma, clearing cellular debris, damaged myelin, and pathogens."
  },
  {
    id: 46,
    type: "matching",
    module: "Histology",
    question: "Match the specific lining epithelium with its typical location in the human body.",
    leftItems: [
      "1. Simple squamous epithelium",
      "2. Pseudostratified ciliated columnar epithelium",
      "3. Transitional epithelium (Urothelium)",
      "4. Stratified squamous non-keratinized epithelium"
    ],
    rightItems: [
      "A. Urinary bladder",
      "B. Trachea and primary bronchi",
      "C. Esophagus and vagina",
      "D. Alveoli of the lungs and endothelium of blood vessels"
    ],
    correctAnswers: { 0: 3, 1: 1, 2: 0, 3: 2 },
    explanation: "1-D: Simple squamous lines alveoli (diffusion) and blood vessels (endothelium). 2-B: Pseudostratified ciliated columnar is respiratory epithelium. 3-A: Transitional epithelium (urothelium) allows distension in the bladder. 4-C: Stratified squamous non-keratinized protects wet surfaces like the esophagus and vagina."
  },
  {
    id: 47,
    type: "multiple-choice",
    module: "Histology",
    question: "Which connective tissue type is characterized by densely packed, parallel bundles of type I collagen fibers and is typically found in tendons and ligaments?",
    options: [
      "A. Dense irregular connective tissue",
      "B. Loose (areolar) connective tissue",
      "C. Reticular connective tissue",
      "D. Dense regular connective tissue",
      "E. Mucoid connective tissue"
    ],
    correctAnswer: "D",
    explanation: "Dense regular connective tissue features collagen fibers aligned in parallel arrays, providing high tensile strength along the axis of mechanical force, making it ideal for tendons and ligaments."
  },
  {
    id: 48,
    type: "open",
    module: "Histology",
    question: "Differentiate between intramembranous and endochondral ossification, outlining the main steps of intramembranous ossification. (Max 200 words)",
    modelAnswer: "Bone formation occurs through two distinct pathways. Endochondral ossification requires a hyaline cartilage model that is progressively replaced by bone (occurring in long bones). Intramembranous ossification forms bone directly within vascularized embryonic mesenchyme without a cartilage intermediate (occurring in flat skull bones, mandible, and clavicle). The key steps of intramembranous ossification are: 1. Condensation of mesenchymal cells, which differentiate into osteoprogenitor cells and then osteoblasts. 2. Osteoblasts secrete the organic osteoid matrix. 3. The osteoid mineralizes with calcium salts, trapping some osteoblasts, which mature into osteocytes in lacunae. 4. Spicules of bone merge to form trabeculae (woven bone), while blood vessels are incorporated to form red marrow. 5. Mesenchyme at the periphery condenses to form the periosteum, and the outer layers of woven bone are replaced by mature compact bone.",
    explanation: "Must contrast: endochondral (cartilage template) vs. intramembranous (direct from mesenchyme). Must list steps: mesenchymal condensation, osteoblast differentiation, osteoid secretion, mineralization/osteocyte trapping, trabeculae/periosteum formation."
  },
  {
    id: 49,
    type: "multiple-choice",
    module: "Histology",
    question: "Which lymphoid organ is responsible for the maturation of T-lymphocytes and exhibits a distinct cortex and medulla, featuring Hassall's corpuscles in the medulla?",
    options: [
      "A. Spleen",
      "B. Thymus",
      "C. Palatine tonsil",
      "D. Lymph node",
      "E. Appendix"
    ],
    correctAnswer: "B",
    explanation: "The thymus is a primary lymphoid organ where T-cell precursors undergo maturation and selection. It has lobules with a dark cortex and a pale medulla. The medulla characteristically contains Hassall's (thymic) corpuscles."
  },
  {
    id: 50,
    type: "true-false",
    module: "Histology",
    question: "Intercalated discs are unique structural features of skeletal muscle that facilitate synchronized, voluntary contractions.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "Intercalated discs are unique to cardiac muscle, not skeletal muscle. They contain desmosomes and gap junctions that allow electrical coupling and synchronized, involuntary contractions of the myocardium."
  },
  {
    id: 51,
    type: "multiple-choice",
    module: "Histology",
    question: "The Blood-Brain Barrier (BBB) is primarily maintained by tight junctions between endothelial cells, supported by the end-feet of which glial cell?",
    options: [
      "A. Oligodendrocytes",
      "B. Microglia",
      "C. Astrocytes",
      "D. Ependymal cells",
      "E. Schwann cells"
    ],
    correctAnswer: "C",
    explanation: "Perivascular astrocytic end-feet wrap around capillaries in the brain and secrete signals that induce and maintain the tight junctions between endothelial cells that form the primary physical barrier of the BBB."
  },
  {
    id: 52,
    type: "open",
    module: "Histology",
    question: "Describe the histological structure and mechanism of the neuromuscular junction (motor endplate) during synaptic transmission. (Max 200 words)",
    modelAnswer: "The neuromuscular junction (NMJ) is the synapse between a motor neuron axon terminal and a skeletal muscle fiber. The axon terminal is filled with synaptic vesicles containing acetylcholine (ACh). The sarcolemma of the muscle fiber is folded into junctional folds (the motor endplate) to increase surface area, housing nicotinic acetylcholine receptors (nAChRs). A synaptic cleft separates them, containing acetylcholinesterase. Synaptic transmission begins when an action potential reaches the terminal, triggering voltage-gated Ca2+ channels to open. Ca2+ influx prompts exocytosis of ACh vesicles. ACh diffuses across the cleft and binds nAChRs on the motor endplate, opening ligand-gated cation channels. Na+ influx depolarizes the sarcolemma, generating an endplate potential (EPP) that fires a muscle action potential. Finally, acetylcholinesterase rapidly degrades ACh to terminate the signal.",
    explanation: "Must include: Axon terminal (ACh vesicles, Ca2+ channels), synaptic cleft (acetylcholinesterase), motor endplate (junctional folds, nAChRs), and signal transduction steps (Ca2+ entry, exocytosis, receptor binding, Na+ entry, depolarization)."
  },
  {
    id: 53,
    type: "fill-in-the-gap",
    module: "Histology",
    question: "The primary resident cell type of connective tissue proper, responsible for secreting collagen, elastin, and ground substance, is the ________.",
    options: [
      "Fibroblast",
      "Macrophage",
      "Mast cell",
      "Adipocyte"
    ],
    correctAnswer: "Fibroblast",
    explanation: "Fibroblasts are the most common cells in connective tissue proper. They synthesize and maintain all elements of the extracellular matrix: collagen, elastic fibers, reticular fibers, and ground substance."
  },
  {
    id: 54,
    type: "multiple-choice",
    module: "Histology",
    question: "Which microscopy technique utilizes a beam of electrons transmitted through an ultra-thin specimen to achieve extremely high-resolution images of internal cellular organelles?",
    options: [
      "A. Scanning Electron Microscopy (SEM)",
      "B. Phase-contrast light microscopy",
      "C. Confocal fluorescence microscopy",
      "D. Dark-field microscopy",
      "E. Transmission Electron Microscopy (TEM)"
    ],
    correctAnswer: "E",
    explanation: "Transmission Electron Microscopy (TEM) shoots electrons through an ultra-thin section of specimen, creating high-contrast projection images that resolve details down to 0.1-0.2 nm (ideal for internal organelles)."
  },

  // PART III: GENERAL EMBRYOLOGY (12 Questions, Q55 to Q66)
  {
    id: 55,
    type: "multiple-choice",
    module: "Embryology",
    question: "The part of the sperm containing proteolytic enzymes to digest the zona pellucida is called:",
    options: [
      "A. Capacitor",
      "B. Head",
      "C. Acrosome",
      "D. Cumulus",
      "E. Corona"
    ],
    correctAnswer: "C",
    explanation: "The acrosome is a cap-like organelle over the anterior half of the sperm's head. It contains lysosome-like enzymes (e.g., acrosin, hyaluronidase) that digest the egg's jelly coat (zona pellucida) during fertilization."
  },
  {
    id: 56,
    type: "multiple-choice",
    module: "Embryology",
    question: "A 55-year-old man has noted sharp pain in his right lower extremity for the past 2 months. MR imaging of his spine shows impingement on a spinal nerve root by a herniated structure located between L5 and S1. From which of the following embryonic derivatives does this herniated structure most likely arise?",
    options: [
      "A. Notochord",
      "B. Amnion",
      "C. Cloaca",
      "D. Lateral Plate Mesoderm",
      "E. Neural crest"
    ],
    correctAnswer: "A",
    explanation: "The patient has a herniated disc. The central portion of the intervertebral disc is the nucleus pulposus, which arises as a direct remnant of the embryonic notochord. The surrounding annulus fibrosus develops from mesoderm."
  },
  {
    id: 57,
    type: "fill-in-the-gap",
    module: "Embryology",
    question: "In the seminiferous tubules, the supporting cells that form the blood-testis barrier and nourish developing spermatozoa are called ________ cells.",
    options: [
      "Sertoli",
      "Leydig",
      "Spermatogonia",
      "Granulosa"
    ],
    correctAnswer: "Sertoli",
    explanation: "Sertoli cells (sustentacular cells) span the seminiferous epithelium. They form tight junctions that establish the blood-testis barrier, phagocytose excess cytoplasm during spermiogenesis, and secrete nutrients and regulatory factors."
  },
  {
    id: 58,
    type: "true-false",
    module: "Embryology",
    question: "Implantation of the human blastocyst typically occurs exactly 24 hours after fertilization.",
    options: ["True", "False"],
    correctAnswer: "False",
    explanation: "Implantation begins around day 6 to 7 after fertilization (not 24 hours), when the blastocyst hatches from the zona pellucida and attaches to the endometrial epithelium of the uterus."
  },
  {
    id: 59,
    type: "multiple-choice",
    module: "Embryology",
    question: "During the third week of development, gastrulation results in the formation of:",
    options: [
      "A. The bilaminar embryonic disc",
      "B. The neural tube",
      "C. The syncytiotrophoblast",
      "D. The three primary germ layers (ectoderm, mesoderm, endoderm)",
      "E. The extraembryonic mesoderm"
    ],
    correctAnswer: "D",
    explanation: "Gastrulation is the defining event of the third week of development, converting the bilaminar embryonic disc (epiblast and hypoblast) into the trilaminar embryonic disc consisting of ectoderm, mesoderm, and endoderm."
  },
  {
    id: 60,
    type: "open",
    module: "Embryology",
    question: "Explain the structure and primary functions of the placental barrier (fetal-maternal interface). Mention the layers that separate fetal blood from maternal blood. (Max 200 words)",
    modelAnswer: "The placental barrier regulates exchange between maternal and fetal blood circulation. It allows transfer of oxygen, nutrients, and antibodies while preventing immune rejection and passage of most pathogens. Fetal blood is contained inside capillaries within chorionic villi, which are bathed directly in pools of maternal blood in the intervillous spaces. Thus, the two circulations do not mix. In early pregnancy, the barrier is thicker and consists of four layers separating maternal and fetal blood: 1. Syncytiotrophoblast (outer layer covering villi), 2. Cytotrophoblast (inner epithelial layer, which disappears in late pregnancy), 3. Extraembryonic mesoderm connective tissue, and 4. Fetal capillary endothelium. In late pregnancy, the barrier becomes extremely thin (mainly syncytiotrophoblast and capillary endothelium) to maximize diffusion efficiency.",
    explanation: "Must describe: role of placental barrier (exchange, immunity), no mixing of blood, and the 4 early layers (syncytiotrophoblast, cytotrophoblast, mesodermal core, capillary endothelium) which thin down in late pregnancy."
  },
  {
    id: 61,
    type: "multiple-choice",
    module: "Embryology",
    question: "The process of embryonic folding in the fourth week converts the flat trilaminar disc into a cylinder. This folding directly leads to the incorporation of the yolk sac to form the:",
    options: [
      "A. Neural tube",
      "B. Primitive gut tube",
      "C. Notochord",
      "D. Amniotic cavity",
      "E. Allantois"
    ],
    correctAnswer: "B",
    explanation: "Embryonic folding in both lateral and cephalocaudal directions constricts the dorsal part of the yolk sac, incorporating it into the embryo's body cavity to form the primitive gut tube (foregut, midgut, and hindgut)."
  },
  {
    id: 62,
    type: "open",
    module: "Embryology",
    question: "Describe the process of neurulation, from the formation of the neural plate to the closure of the neural tube. (Max 200 words)",
    modelAnswer: "Neurulation is the process of forming the neural tube, the precursor to the central nervous system. In the third week, the underlying notochord secretes signaling molecules (e.g., Noggin, Chordin) that induce the overlying ectoderm to thicken into the neural plate. During the fourth week, the lateral margins of the neural plate elevate to form neural folds, creating a central neural groove. The folds gradually move toward the midline and fuse together, converting the plate into a closed hollow tube. Fusion begins in the cervical region and proceeds cranially and caudally, like a zipper. The neural tube remains temporarily open to the amniotic cavity via the cranial and caudal neuropores, which close on days 25 and 28, respectively. Cells at the lateral margins of the neural folds migrate away as neural crest cells.",
    explanation: "Must include: notochord induction, neural plate thickening, folding (folds and groove), fusion starting in the cervical region, and closure of the cranial/caudal neuropores (days 25/28)."
  },
  {
    id: 63,
    type: "multiple-choice",
    module: "Embryology",
    question: "Which of the following structures is derived from the embryonic ectoderm?",
    options: [
      "A. The skeletal system",
      "B. The epithelial lining of the gastrointestinal tract",
      "C. The muscular system",
      "D. The dermis of the skin",
      "E. The central and peripheral nervous systems"
    ],
    correctAnswer: "E",
    explanation: "The ectoderm gives rise to the nervous system (via the neural tube and neural crest) and the epidermis of the skin. The gut lining is endoderm; skeleton, muscles, and dermis are mesoderm."
  },
  {
    id: 64,
    type: "true-false",
    module: "Embryology",
    question: "The notochord provides the longitudinal axis of the embryo, induces the overlying ectoderm to form the neural plate, and eventually becomes the nucleus pulposus of the intervertebral discs.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "The notochord is a key transient signaling center in the early embryo, acting as a structural axis, inducing neurulation, and leaving its only adult cellular remnant in the nucleus pulposus."
  },
  {
    id: 65,
    type: "multiple-choice",
    module: "Embryology",
    question: "The umbilical cord normally contains which of the following blood vessels?",
    options: [
      "A. Two umbilical veins and one umbilical artery",
      "B. One umbilical vein and one umbilical artery",
      "C. Two umbilical arteries and one umbilical vein",
      "D. Two umbilical arteries and two umbilical veins",
      "E. Only lymphatic vessels"
    ],
    correctAnswer: "C",
    explanation: "The mature umbilical cord contains three vessels: two umbilical arteries (carrying deoxygenated blood from the fetus to the placenta) and one umbilical vein (carrying oxygenated, nutrient-rich blood from the placenta to the fetus)."
  },
  {
    id: 66,
    type: "matching",
    module: "Embryology",
    question: "Match the embryonic structure with its ultimate developmental fate.",
    leftItems: [
      "1. Inner Cell Mass (Embryoblast)",
      "2. Trophoblast",
      "3. Neural Crest Cells",
      "4. Splanchnic (visceral) lateral plate mesoderm"
    ],
    rightItems: [
      "A. Forms the wall of the primitive gut tube.",
      "B. Gives rise to the fetal portion of the placenta (chorion).",
      "C. Migrates to form peripheral ganglia, melanocytes, and craniofacial bones.",
      "D. Gives rise to the entire embryo proper."
    ],
    correctAnswers: { 0: 3, 1: 1, 2: 2, 3: 0 },
    explanation: "1-D: Inner cell mass becomes the embryo proper. 2-B: Trophoblast becomes the fetal placenta (chorion). 3-C: Neural crest cells migrate to form peripheral ganglia, melanocytes, and craniofacial bones. 4-A: Splanchnic mesoderm forms the smooth muscle and connective tissue of the gut wall."
  },

  // PART IV: INTERDISCIPLINARY (4 Questions, Q67 to Q70)
  {
    id: 67,
    type: "multiple-choice",
    module: "Interdisciplinary",
    question: "Which of the following best explains why epithelial tissues can maintain rapid turnover and effective barrier function?",
    options: [
      "A) Epithelial cells exhibit high proliferative capacity due to the presence of adult stem cells located in specific niches, and they are tightly joined by junctional complexes that maintain polarity and barrier integrity.",
      "B) Epithelial tissues are composed of multinucleated cells that divide asynchronously to maintain homeostasis.",
      "C) Rapid turnover is sustained by fibroblasts that stimulate epithelial mitosis via collagen production.",
      "D) Epithelial regeneration relies mainly on apoptosis of surface cells, with minimal need for proliferation.",
      "E) Epithelial cells function independently of the extracellular matrix, allowing for higher renewal rates."
    ],
    correctAnswer: "A",
    explanation: "Epithelial tissue longevity and barrier function depend on: (1) adult stem cells residing in specialized stem cell niches (e.g., basal layer of epidermis, crypts of small intestine) that proliferate to replace shed cells, and (2) cell-to-cell junctional complexes (tight junctions, desmosomes) that preserve polarity and seal intercellular spaces."
  },
  {
    id: 68,
    type: "true-false-cluster",
    module: "Interdisciplinary",
    question: "Evaluate the following statements regarding mitochondria across cell biology, histology, and embryology:",
    statements: [
      {
        id: "A",
        text: "A) Cardiac muscle cells have high mitochondrial density to sustain continuous ATP production.",
        correctAnswer: "True"
      },
      {
        id: "B",
        text: "B) Transmission electron microscopy can be used to visualize mitochondrial cristae and matrix density in situ.",
        correctAnswer: "True"
      },
      {
        id: "C",
        text: "C) Mitochondria in early embryos are maternally inherited and essential for energy supply during cleavage.",
        correctAnswer: "True"
      },
      {
        id: "D",
        text: "D) Mitochondria cannot be detected by any histological staining techniques.",
        correctAnswer: "False"
      }
    ],
    explanation: "A is True: Cardiomyocytes require high ATP and are packed with mitochondria (~40% cell volume). B is True: TEM provides the nanometer resolution needed to see inner membrane cristae. C is True: Paternal mitochondria are selectively destroyed in the oocyte; embryo mitochondria are 100% maternal. D is False: Mitochondria can be stained histologically using iron hematoxylin or histochemical assays for mitochondrial enzymes like succinate dehydrogenase."
  },
  {
    id: 69,
    type: "open",
    module: "Interdisciplinary",
    question: "CRISPR-Cas9 genome editing has recently been applied to treat certain hematological diseases. Choose one such condition and briefly explain how CRISPR-Cas9 is used to address it. In your short answer refer to: (1) Cell biology concepts such as gene expression, stem cell manipulation, or DNA repair mechanisms; (2) Histological aspects including the structure and function of the affected blood cells or tissues. (Max 200 words)",
    modelAnswer: "Sickle Cell Disease (SCD) is treated using ex vivo CRISPR-Cas9 editing of patient hematopoietic stem cells (CD34+). In SCD, a mutation in the beta-globin gene causes abnormal sickle hemoglobin (HbS) that polymerizes under hypoxia, turning normally flexible, biconcave erythrocytes into rigid, sickle-shaped cells that block capillaries (vaso-occlusion). To treat this, CRISPR-Cas9 is programmed to cut the erythroid-specific enhancer region of the BCL11A gene in stem cells. The cell repairs this double-strand break using error-prone Non-Homologous End Joining (NHEJ), which introduces insertions or deletions that disrupt the enhancer. BCL11A is a repressor of fetal hemoglobin (HbF) gene expression. Disruption of BCL11A de-represses HbF. The edited stem cells are re-infused into the bone marrow. The resulting erythrocytes express high levels of HbF, which prevents HbS polymerization, preserving normal red blood cell histology and capillary blood flow.",
    explanation: "Must detail: condition (e.g. Sickle Cell Disease), cell bio mechanism (CRISPR targeting BCL11A enhancer, NHEJ repair, de-repression of HbF, stem cells), and histological aspect (preventing erythrocyte sickling/rigid shape, ensuring smooth microvascular flow)."
  },
  {
    id: 70,
    type: "matching",
    module: "Interdisciplinary",
    question: "Match the cell cycle or embryological stage with its defining cellular/histological outcome.",
    leftItems: [
      "1. G1/S Transition (Restriction Point)",
      "2. S Phase",
      "3. Metaphase-to-Anaphase Transition",
      "4. Cleavage"
    ],
    rightItems: [
      "A. Rapid mitotic divisions of the zygote without intervening growth phases, producing a multicellular morula.",
      "B. Activation of APC/C leads to securin and cyclin B degradation, separating sister chromatids.",
      "C. Retinoblastoma (Rb) protein is phosphorylated by Cyclin-CDK complexes, committing the cell to division.",
      "D. Centrosomes duplicate and the genome is replicated, yielding cells with a 4c DNA content."
    ],
    correctAnswers: { 0: 2, 1: 3, 2: 1, 3: 0 },
    explanation: "1-C: At the G1/S transition, Cyclin-CDKs phosphorylate Rb, releasing E2F to commit the cell to division. 2-D: S phase involves centrosome duplication and genomic DNA replication. 3-B: The Metaphase-to-Anaphase transition is triggered by APC/C, degrading cyclin B and securin to separate chromatids. 4-A: Cleavage refers to rapid zygotic divisions without cell growth, producing a morula."
  }
];

// Global scope export for browser usage
window.CBEH_QUESTIONS = questions;
