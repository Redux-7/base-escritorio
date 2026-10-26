// Tienda de Base · Destrabá: sacá el bloque. Tres versiones (clásico, sobre hielo y bloque grande) con niveles que se pueden resolver todos.
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, pick, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  // niveles generados y verificados con un buscador (el número es la menor cantidad de movimientos posible)
  const LV = {"rush":[[[".BB.F.HH.CF.AA.C.E.GGC.E.DD.I.....I.",3],[".DDDC....GC..AAG...H.FFF.HBI...HBIEE",3],["FFF.MMKDBBBHKDAA.HJJ.GGG.EEEINCCLLIN",3],["CCC.H.IIG.H.AAG..DB....DBF.E...F.E..",3],["EEF.....FC.DGAAC.DGII..DG...H...BBH.",3],[".G.....GFEE.AAFD..JJBDCC..B.II..HH..",3],["...GGGF..IIEF.AA.EF.C...BBC..DHH...D",3],[".HEE.G.H.B.G.AAB...JJ.DDF..II.F..CC.",3],["HGF...HGFEEDAAI..D.BIC...BIC...B....",3],[".G.....GBBF.AA..FIDDD..I.CC.EE...HHH",3],["...KKKBBCC.JLFAA.JLFHGDD.MHGEE.M.II.",3],["DD.GGGIJLLLBIJAACBEE.HC.NFFHCMNKKH.M",4],["F..KKNFGGGLNI.AALEIHDDBEJHCCBEJHMMB.",4],["...GJJBBBG..F.AAHKF..DHKCCCDHKII.EE.",4],["MDL.JHMDL.JH.DAAGF..EEGFK.BBBFKCCII.",4],["FFLLC..MMDCHAABD.H.GB.K.IG..K.IEEJJ.",4],["E.HH.GE...FGAA..FGD..CC.D.BB..D...II",4],[".FFFLLDDBBBH.AA..HI.CCCGIEEEJG.KK.J.",4],["MMM.BB.DDEEJC.AAGJCHH.GKC.II.K.LLFFF",4],[".K.HH.IKCC.DI.AAGDJBFFG.JBLLMM.EE.NN",4],[".II...EEHCCGAAHF.G..BFJ...B.J.DDD...",5],["...JJ....IB.AAGIB...GD.CEF.DHCEF..H.",5],["..GGLLKK..DI.AA.DIBEECCCB.FFJJ...HH.",5],["EE....FJJHH.FAABKG...BKG..CC.IDD...I",5],["ILL.JJIDDDBF.MAABF.M..KKCC..EEHHGG..",5],["..DFFFJJD.HCAAD.HCGGKK..IE....IE.BB.",6],[".E..II.E..HC..AAHCF.JJ.CF.GGKKBBBDD.",6],[".GGBB.H...IEH.AAIE.C.DDE.C.FFF.C.JJ.",6],["LD..HHLDG.IIAAG.CJF.EECJF...C...BBKK",6],["...FEKBB.FEKDAAHCKD..HC.III.....JJGG",6]],[[".HHFFF.KK.JJ..AABCEGG.BCEMDDIIEM.LL.",8],["IGCJ..IGCJBBAAC....HH.D.EEKKD....FF.",8],[".KL.C..KLIC.DAAIB.D..GB.FJ.GB.FJEEHH",8],["JKKKEEJ..GGGJAA.BIFFF.BIDMMHBLDCCH.L",8],["...IDDBBKILJAAKMLJFFFMECG.H.ECG.H.EC",8],[".D..FF.D.EC..AAEC.B.G.C.B.GIHH...I..",8],["K.FFJJKHHBBB.AA..LG.MIILGCMEDN.C.EDN",8],[".DDDIGCCC.IG.AAE.JFF.E.J.HBBBJ.HKKLL",8],["MGEEE.MGJJNHAAK.NHDDKBC.IIKBCF.LLB.F",8],["BBGGGHEE...HC.AA.HCJJII.MMDKKKFFDLL.",8],["..HH....J..KAAJI.K..JI.FGGBBDFCCEED.",8],["B.JJ.HBKKGIHAAEGIH..ECCC.FF...LL..DD",8],["CD.F.ICD.FKI.DAAKILBB.GGLMHEE..MHJJJ",8],["H..CCJHKKKGJE.AAGJEB..DD.BFFF..BLLII",8],["C.HEEECKH.J.CKAAJ..GG..I...FDI.BBFDI",8],["IIIF.C...F.C..AADCBBG.D...GHJJEE.H..",9],["GLLHMMG..HKJGAAHKJ..EEII.CC.BB..DDFF",9],["..C.BD..C.BD.IAABDHIGGKKHJJEE...FF..",9],["D..IIID.H.ECAAH.ECKK.GELJ.BG.LJ.BFF.",9],[".FFFII...G.E.AAG.ELBCKKELBC.DD.BHHJJ",9],["EI.BB.EI..K.EAAHK.L.FHJJL.FH.DCC.GGD",9],["JJGG...LL.EHKFAAEHKF..EDBCCIIDB.....",9],[".EEE..I...CJIAA.CJI.HHC.DD.BFF.GGBKK",9],["..EDD...EBB.AAE..F...HHFJGGGC.JII.C.",10],["JMMMKKJIIGNB.AAGNBCL..DDCLHHH.CFFEEE",10],[".KK.B.JJ..B..AACB.IIGC...EG.FF.EHHDD",11],["CCBBB.H...GDH.AAGDH.J.GD.FJEEE.F..II",11],["BH.DD.BH...J.AAFGJ..CFG...CI.E..CI.E",11],["B.II.JB.LH.JAALHC..KEGCF.KEGDF.KE.D.",11],["BBB...CCCHH...AAI...G.I.D.GFEED..F..",12]],[[".D..H..D.IHFBAAIHFBEJCC.BEJ.GGKK.LL.",14],["C.EDDKC.E..KAAGB..HJGB..HJ.IIF.J...F",14],["DD.CCNLGGK.NLAAK.JHMFEEJHMF.BJ.II.B.",14],["IEEJMMI.BJKKAABJF.H.B.FCHDGG.C.DNNLL",14],[".BEKKK.BENHH.AANLIF.JJLIFGGDD..MM.CC",14],["..LLBB....HKAAIGHKF.IG.EF.ICCE..JJDD",14],["LL.FFF.BBCNJ.AACNJIIDMMGEED..G.HH.KK",14],["....JJ..DKK.AADF.BHEEFLBHGCCLIHGMM.I",14],["BB.E.....EHGAA.IHG.JDI.G.JD.FF...CCC",15],["..HHHC.BBBECAADJEF..DJEF..GGG....II.",15],["..HHEGCCC.EG..AAE.IBFJJ.IBF.DDKK....",15],[".DBFF..DB.H.AA..H.CCCEG....EG...JJII",15],["CC..E....JE.AAGJFI.KGJFI.K..HH.BBBDD",15],["....BH.EEEBHAAD..H..D.C..GFFC..GII..",15],["H.BBBJH.F.IJAAF.IC.E..IC.ED..C.EDGGG",15],["B.GGG.BCC.HJ..AAHJDD.KH..IEKLL.IEFF.",16],["..KMM.CCK.LIG.AALIGJJFFDBBHHHD...EE.",16],[".G..B..GCCBFAAH..F..H.KI.DDDKIJJ.EE.",16],["EEGI....GIK..AA.KHC.J.KHCDJ.BB.D.FF.",17],["..DCCG..DFLG.AAFLGKK.BB..JEEHH.J..II",17],["I..BB.I.GGGLCAAF.LCNNFE.MDHHEJMDKK.J",17],["II.DLLJCCDKFJEAAKFJEBBGF.E..G..HH...",17],["JGGBH.J..BH.AA..H..DKEII.DKEFF...CCC",18],[".IIH.JE..HKJEAA.KJ.DDLK.GB.LCCGBFF..",18],["FFFCGGJJ.CKDAA..KD..EMMLH.EIILH..BB.",18],[".BIIKF.BGEKFAAGE..HHGCD.L..CDJL....J",18],["KKDDC.HFF.CMHAAG.M.JBG.M.JBEE.LLB.II",19],["MM..CC.GGGELAA..ELJJB.EHIDBKKHIDFFF.",19],["H.BBBDH.CG.DAACG...JCKKI.J..FI.EEEFI",20],["....GHI.DDGHIEAAG..EBJKKC.BJLLC..FFF",20]],[["JCCLGGJ.ILDDAAI.B..EE.B.FFF..KMMHHHK",21],["..CCC..DDF.JAANFLJMMNIL.EBBIHGE.KKHG",21],[".FFF.ED...CEDHAACJIHL.CJIHLGG.IBBKK.",21],["BBB..JEEDHKJAADHK....GG.IFFCC.I.....",21],["LCCCIML.BBIMAA..ID.FHH.DEFJKGGE.JKNN",22],["CCLLLEFFNNGEK.AAGMKH..GMKHBDD.JJB.II",22],["..KK.BJJJGGBAADEHL..DEHLI...CCI.FFMM",22],["...DFFE..DLMEAA.LMHHI.L.BBIGGJ.CCKKJ",22],["DD..HIMEE.HIMKAAH..KBLGGJ.BLFFJCCC..",22],[".IMJJN.IMFFNAAKD.GBBKD.GCLLDH.C.EEH.",22],["EEII....DDD.H.AAC.HGGJCKMF.JCKMFLLBB",22],["ILL.BBI.KKH.IAAGH.JJJGHD..FCCDEEF..D",23],["I.JJ.CIKK.LCAAG.LCDDG...HHH.FF.EE.BB",23],["KIIGG.K.ED..AAEDH..FFCHJBBBC.JMM.LL.",23],[".BB..JHHHDDJAALGKMCCLGKMF...IIF..EE.",23],["..FFFCEEEL.CAADL..JJDH.IBKKH.IB..GG.",24],["G.BJJJG.B.D.AA.CDIFF.CDI.HKK...HEEE.",24],["EGGKFFE.JK..AAJ..B..IIDB.LLLD.CCHHD.",24],[".FF.E.GGGDE..AADC.I.HDC.I.HKKB.LLJJB",24],["LCC...L.DD.GAAHFBGEEHFBKJJJMMK.IIINN",25],["KKKGG..HHJJDAAI..DE.I.BBELLFM.CC.FM.",25],["L.MMEEL.HDDFAAH.CFNN.JCGBBBJ.G.IIKK.",26],["IJJLLLI.HGGGAAH...KK.CDBFFFCDBEEE.DB",27],["EEE.JIHNNGJIHAAGJMF..DDMFLB.KK.LBCC.",29],[".GGG...CCHI.KAAHI.KJJ.I...EBFFDDEB..",32]]],"ice":[[["CCBB...IHH...IAADEF..KDEFJ.K.E.JGG..",3],[".E.LLF.EJBBFAAJ..GDD.K.GII.KC.HHH.C.",3],["..CC..BBJJII..AAGDH..EGDHFFE..H.KK..",3],[".EEIH....IHKAA..JKLLDDJB.FFF.BGGGCCB",3],["G.EED.GFFFD...AACI....CI..BBC...HH..",3],["..B.GGIIBD..AAED..J.EC..JHEC...H.FF.",3],["DDIIH.EE..H.GAA.H.G..CCCFB....FB....",3],["..JFKKGEJFMMGEAAC.HID.CLHID.CL.I.BB.",3],["HHGGMMIIIBBBF.AAJEFC.KJENCDK.ENCDLL.",3],["DH..E.DH..E.AAI..F..I..FBBC..FGGC...",3],[".FFBJJ..DBLLAAD....KK....GGGCCHHIIEE",3],["DDIIBB..GG....AAEC.H.FEC.H.F........",3],[".G..HH.G..D..AA.D.IICEBBKKCEFFJJJE..",3],["KKCCC...HEE.AAH...GFJJDDGF.BBB..IILL",3],[".C.D.F.C.DBF.AA.BFGGII.....EH....EH.",3],["....FFBB.ID..AAID.CC..JJ.G.EE..GHH..",4],["KKJJ..LLB.HCAAB.HCF.BD.EFG.D.EFG.II.",4],["...G..FF.G..IAA..CIB.H.CIB.H.C.DDDEE",4],[".I.CDEBI.CDEBAA.D.B.FFF.......HH.GG.",4],["H..DDEH..IIEAA..G.....G...B.G.CCBFF.",4],["J.IIIGJBBBFG.AA.FLEK.MMLEK.CC..HHDD.",4],["....JJGG.BB.L.AAKHLCCCKHII..DFEE..DF",5],[".JJ..DLFFE.DLAAEGB.CMMGBKC..NNK.HHII",5],[".JJ...FFHGG.AAHD..CC.D...BBIII...EEE",5],["..EELLGGIICC.AA.H.BDMKHJBDMKHJB.FFNN",5],["H.FFF.HLLE.I.AAE.IGG.C..KJDC.BKJD..B",5],["GGJ..KH.JCCKHDAAELHD.MEL.IIMEL..BBFF",5],["..KEMHFFKEMHI.AAM.IL.GGC.LDDDCJJ..BB",6],["E..F..E..FGG.AA..H..KK.HJCBBDDJC..II",6],["...JJ...CCFF.AA.BIDD.EBI.H.EGG.H....",6]],[["FF.II..BLLHH.BAA.MEGGGDMEKJ.DC.KJ..C",7],["..HH.JCCDD.JAAIFEJK.IFE.KBG...KBG...",7],["E..HHHEGGDICMAADICMFFDKKBBLJJ...LNN.",7],["BBBD.....D...AADI.JECCI.JE.HHG.FFF.G",7],["..FF...DDDGCIAA.GCIJ.B.CIJ.BEE.HH...",7],["FCCC..F...GIFAA.GIED...IEDHH..EDJJBB",7],[".JGGG..J.C..AA.CF..BB.FE.IIIDE.HHHDE",7],["MF.II.MFELGGAAELH.CC..H...JJDD.KKBB.",7],["I.FFF.I.HHH.AA.JGLCCKJGLBBKJDD..KEE.",7],[".EEHHH...D.BAAJD.BC.JDIBC.GGI.C..FF.",7],["J...F.JHDDFIEHAAFIEHBBBI.......CCGG.",7],["..II.....FF.AAECKJ..ECKJ.DD.GB..HHGB",7],["GEJII.GEJ.B.AA.DB....D...CFFFH.C...H",7],["CC.JDDFKKJHNF.AAHN.BBBEEMI..GGMILLL.",7],[".KFFCCEK..DLEAA.DLE....JG..HBJGIIHB.",7],["EIIFF.E.DDDL..AAHLBBJJHLMMGGG.CC.KKK",8],[".GG....E..J.DEAAJCDE.BBC...I.C.HHIFF",8],["JCCCK.J.FGK.AAFG...HIIEE.H.DDD..BB..",8],["B..FDDB..F...CAAEHICM.EHI.MJJGLL.KKG",8],["GGGI.....I.D.AA.CD.EEECD.HJJFF.H.BB.",8],["....FE.D..FECDAAF.C.H.BBIIHGG.JJ....",8],[".GLLL.HG.FFBHGAAKB.DDDK.CCCIJJ.EEIMM",8],["...EJJ.GGE.DAA.H.DLFFHCDLBBBC...IIKK",8],[".C..BJ.CGGBJ.AA.EK..DHEK..DHII.FF...",9],["LLHHH..FFFGMAA..GMJBBEECJDDNNC..KKII",9],["NNBBB.GKKKMHGDAAMH.DCC.HIF.JJ.IFEELL",9],["HH....EEE..GAABD.G..BD..JCI.FFJCI...",9],["EE...BCCFFIBAA..IKHH..IK.LDDJJ.L..GG",9],["BBB..I..EEKIAAD.KI..DGK.CHFG..CHFJJ.",9],[".DDLL.G..IK.GAAIK.GFFFBBCEJ.HHCEJMM.",10]],[[".H..F..H.CFGAA.CFG..D..GI.DEE.I.DBB.",11],["HHH....IIEC.AAFECG..FE.G..BDDG..B.JJ",11],["..H.FFL.HJJJL.AACI.MG.CI.MGBEEKK.BDD",11],["GG..IE.BB.IEDAA.I.DJJ...CCHFFK..H..K",11],["G.ECCCG.EH.JGAAHIJKB.HI.KB.DD.FF....",11],[".DD.....FEEEAAF.H.C...H.C.IIB.GG..B.",11],["...E.H...ECHAA..CI.FF..I.B.GDD.B.G..",11],["E.....E..B.GEAABJG.IIIJGFFHCCC..HDDD",11],["LFFF.HL.CCCHAAJK..GMJKBIGMEKBIDDE.B.",12],[".EEBB.KKFHH.AAF...C.F..GC..DJGIIIDJG",12],[".DD.GG...F.HAAIF.HC.I...C.IBEE...B..",12],["ELLL..EFFIGGAAJIKDMMJIKD.H.CC..HBB..",12],["CC.FF..EEEBLIAAMBLI.GMBK..GDDK.HHJJK",12],["MG.HH.MGCCDDAAJ.K.EEJ.K..LLFIN.BBFIN",12],["..DEEJLLDMBJAA.MB.K.IIB.KFFHHN.CCGGN",12],[".B..GG.BHHE.AAI.E.F.I...FDD.C.....C.",12],["..HF.IMMHFCIBAAFCKBEEE.KGG..J.LLDDJ.",12],[".BK....BK.IEAAHJIEGGHJFFLLCCCM..DDDM",12],["FJLL.KFJEEEKAAC...BHCNIIBHGNDDB.GMM.",12],["BCCIDDB..I.L..AA.LGEE.HHG.FKMM..FKJJ",13],["F..JJ.F.IIHHAALG...NLGD.BNMMDEBKKCCE",13],["G.F.DDG.F...AAF......I.BHHHIEB.CC.EB",13],["BCC.D.B..ED..AAEIF.HG.IF.HG.KKJJG...",13],["JJ..F..HHHFBIAA.FBIGG...D.CEEED.CKK.",13],["IILLG...CCGD..AAGDJ.EBB.JKEMM..KHHFF",13],["L.BBB.LIID.KAACDGKNNC.GFJJHHHFEEMM..",14],["LI.HHMLIG.DMAAG.D.FFKE.J..KEBJ.CC.BJ",14],["LLGGHJC...HJC.AAH.EEK.BB.IK.DD.IFF..",14],["NNHHEL.GGMELIAAM..IDDDBBICCCFF.JJKK.",14],["BBBFF.III.JC.AAKJCLLDK.CG.D.EEG..HH.",15]],[["KKK.H..JJEHFAAIEHFL.IBBMLGGG.MCC..DD",16],["I.GGB.IKKLB.AAHL..CCH..D.EFJJD.EF..D",16],[".KEECC.KG.B.AAG.BJF.IIBJF..DD.HHH...",16],["EEE..H..JD.HAAJDF.KK.DF.CBB.IIC.GG..",16],["MIGGGCMIDJ.CAADJ..BED.KKBEHHF..ELLF.",16],[".HHC.D...C.D.AACB.F...B.FEIIBJFEGGGJ",17],["..CGBB..CG..AAKJD..IKJDEHIFFDEH.....",17],["G...B.GCC.B.AAEJKFDDEJKFIII..F.HHH..",17],[".ICCCK.I..GKAAJLG.FFJLBMD.HHBMD.NNEE",17],[".JJEEBKKFFIBAA..I..HCCI..HL.DDGGL...",17],["LIMMM.LICKEEAACKGH..CKGH..BBDJFFNNDJ",17],["...BBB.LLJ..AACJH.D.CEH.DIIEGGFFFKK.",17],["MCCH..M..HB.AA..BFII.EBFKJDEGGKJDLL.",18],["DD.JEE.BBJ....AAIF.GH.IF.GHCCF..H.KK",18],["GGBLLNM.BDDNMAAH.N.JJHKKIIIEE..CCFF.",19],[".GC....GCE.KAACEIK.FFJIHBDDJIHB.....",19],["L.J.DDL.JKE.AA.KEF.HHH.FCCCGGF.BBBII",19],[".KKIIB..GE.BAAGE..C.GHH.CJJ..F.DDD.F",20],["..I.EBHHI.EB.JAA.BCJDD..CLLKFF.GGK..",20],[".DDD.E..F.GEAAF.GK.HHH.K..BICC..BIJJ",20],[".BMMCC.BLKKDAALNIDEFFNI.E..GGH.JJ..H",20],["LEE..FL.HHCFAA.MC.KKIMCJNDIBBJND.GG.",21],["EE..HL.GGGHLAAB.K.CJB.KICJ.FFI.DD...",21],[".KKKI.B..HIGBAAHIGL.JEE.LFJ.CC.FDDD.",21],[".III.BKKMH.BAAMHD.LFFCD.LGGC.E.JJ..E",21],[".HHHLLJJ.KKMAAE..MI.EDDBICC.GBFFF.G.",24],["LLCC..JJJMI..AAMIEGKB..EGKBHHEDDBFFF",25],["..GGF..DDDF.BAA.C.BJHHC..JE.II..EKK.",27],["LFBDD.LFBKKMAA..JM..HHJECCC.IEGG..I.",27],["MHHKKCM...DCAAJ.DL..JBBL..JGEEFF.GII",27]]],"k":[[["EGDFIBAAIBAAH..CH..C",5],["JHBEFFAA.CAAGC.DG..I",6],["DDHIFBAAFBAAG.ECG...",6],["BBIIC.AAHFAA..G.DEGJ",6],["J.HCGAA.GAA.DEI.DEBF",7],["GGCDAA.DAAH.EIBJFI..",7],["C...AA.IAABGDFBEDFHJ",7],["JGG.CHAADHAAFIBE...E",7],[".FIIHAADHAAE.BCEG.C.",7],["IIJFC.AAB.AABEHD.EG.",8],[".AAFIAAGH.D.CEJBCE.B",8],["EGGD.AADIAAFBC.FBJH.",8],["GIJ.AAJDAA.B.CEH.CEF",8],["HDFFHDAA.EAA.EBI.GC.",8],[".BEDAAGDAAC.H.CFH.IF",8],["C.DDC.AAFIAAFIHE..BG",8]],[["EEJFAAJ.AAHDB.HIG..C",9],[".IIFGHAAJHAAD.BE..CE",9],[".FC.AACDAABDEHI.E.GJ",9],["FE..AAGDAAGDBCHJIC..",9],[".AAGHAAGE.CBEFDI.F.I",9],["FAACGAABGDIE.DIEH...",10],[".AAJ.AABEFCDEIGH..GH",10],["FAAH.AABC..BC.DIGEDI",10],["HAAEGAAEI.JBCDFBC...",10],["..F.EEAAHIAAHDGB.DCB",10],["AA.CAAICF.I.DEHGJEB.",11],["IGAAJCAA.CF.HBB.HD.E",12],["D.AA.GAA.GHEFCHEJIB.",12],["BG..BDAAIHAACCEFJ..F",12],["..CCAAIFAA.GJBB.JDHE",13],["BGAAHGAAH.F..CF.DDEE",13],["EHAAE.AADJBBD.CI..FG",13],["F.DDBAAJEAAGEICC.H..",13],["BEH.BIAA.CAADC..DGFF",13],["AACBAACDG.F.GEI.HEI.",13],["GFAACHAAC.BB..EI.DEI",13],[".CF.AAFEAA.BHG.IHGDD",14],["AACCAAFEH..DHGGDB..I",14],["ICAAECAAEHB.GGD...DF",14],["DIAAJ.AA.GFFEE.C.HBB",14],["AAFFAA.HDECCDE.IB..G",15],[".JAAEEAAIGG.BDC..DFH",16],[".CI..CAAEJAABDG.HHGF",16],[".AAHFAAIF.BCD.BCGGE.",16],[".AAEIAAEJBC.FHG.FDD.",16]],[[".IH.GGAADFAADFCBJ.EB",17],["EAA.EAAGII.BC.HDCFF.",17],["..EEDAAFDAAG.HHG.CCB",17],["AAB.AAHHDDF..CF.ECGI",18],["JAABCAABCHG.EHGFID..",18],[".AAGHAAIH.BIDJBEDFC.",18],["...FBDAABHAAEGGJEICC",19],[".AAIHAAFDGGJCB...BEE",19],["IICCGAA.HAABHFEBDF..",19],["G.CEAAHEAAFDB.FIBJ.I",19],["G.AAG.AAHHFDCCFBE.I.",20],["HB.CHAAC.AA.FFEDG.ED",20],["JBAACBAACD.GE.HIE.FI",20],["FCAAF.AAHBE.HBDIJJG.",21],[".AAE.AA.DDFGCIFHCBB.",21],["BDDFBAAFHAACH..C.EGG",21],["CBAAEIAAEI..FD.GJDHG",21],["DAAIDAAFEBBGE..GH.CJ",21],["AAGIAAGI.F.HJFECD.EB",21],[".GEHDGAADJAACBFFIB..",22],["AA..AAFH.CFIBCDIEJDG",23],["AAEEAAB.HIIGCDJG.FF.",23],["I.AAFCAAF.GEBBGDH.JD",24],[".HEECGAA.GAAIIDBF.DB",24],[".CAABDAABDJFIHG.I.EE",24],["AAGGAADFHHDCIJEB.J..",24],["FBJ.FBAAIDAAHGECH.E.",25],["HGAAHBAAFJCIDDC..EE.",25],["H.JGFAAGDAA.CB.ICBEE",26],[".AADBAADBHG.JE.CFIIC",27]],[["IAAGBAAGB.HDCCHF..EF",29],["..I.AAIGAAFFBHECBDJC",29],["GAA.BAAEIIJEDC.H.CFH",29],["DGAAEGAAE.B..JBHFCII",29],[".AAIGAA.BBDC.EDCHFFJ",30],["D.CBAA.BAAI.EFHHJFGG",31],[".AACGAACB.EFBDEH.DII",33],["HAABHAA..FFGDJIGEE.C",34],["AAGIAAGIB.CCH.DFE.DF",38],["AADFAADHJIICB.ECBGE.",47],["DD.JEAAJCAABCF.HGGIH",49],[".HAA.CAAECIFEDIFBJGG",51],["F.AAEDAAIDBCI.BCGGHJ",51],["JHAACHAAC.FI.GEBDDEB",54],[".EAAFBAA.BDDIGCCIG.H",55],["JHAAD.AADE.BIEFCIGGC",60],["EFAAEFAAGDDC.BJCIBH.",63],[".CGJAAGBAAI.HHIEDDFE",103],["BAACBAACDEEFDGHFI..J",81]]]};
  const MODES = {
    rush: { n: 'Clásico', W: 6, H: 6, d: 'Deslizá cada pieza en su dirección y sacá el bloque marcado por la salida de la derecha.' },
    ice: { n: 'Sobre hielo', W: 6, H: 6, d: 'Las piezas patinan: cuando empujás una, sigue hasta chocar con algo. Sacá el bloque marcado por la derecha.' },
    k: { n: 'Bloque grande', W: 4, H: 5, d: 'Las piezas se mueven para cualquier lado. Llevá el bloque grande hasta la abertura de abajo.' }
  };
  const TIERS = ['Fácil', 'Medio', 'Difícil', 'Experto'];
  const COLS = ['#e0a33a', '#3f8fd6', '#46a35e', '#8b5fd0', '#d06aa4', '#2fa8a0', '#c7793d', '#5d77c9', '#9aa83a', '#b85a5a', '#4ea3c9', '#a07a4f', '#6a9a7a', '#c0943a'];
  const CSS = `
.dz{position:relative;height:100%;width:100%;display:grid;grid-template-columns:minmax(0,1fr) 250px;grid-template-rows:minmax(0,1fr);overflow:hidden;gap:16px;padding:14px;box-sizing:border-box;color:#f4f1ea;background:radial-gradient(120% 100% at 30% 20%,#4a3a2c,#2b2119 70%,#1d1611);font-family:inherit;user-select:none}
.dz[data-skin="ciudad"]{background:radial-gradient(120% 100% at 30% 20%,#3a4250,#232831 70%,#171b22)}
.dz[data-skin="neon"]{background:radial-gradient(120% 100% at 30% 20%,#1d1638,#0e0b1e 70%,#07060f)}
.dz-stage{display:grid;place-items:center;min-width:0;min-height:0}
.dz-board{position:relative;width:calc(var(--W)*var(--c));height:calc(var(--H)*var(--c));padding:calc(var(--c)*.12);border-radius:calc(var(--c)*.2);background:linear-gradient(#b9875a,#9c6c42);box-shadow:inset 0 0 0 calc(var(--c)*.06) #7a5232,0 14px 34px rgba(0,0,0,.45);touch-action:none}
.dz-board::before{content:'';position:absolute;inset:calc(var(--c)*.12);border-radius:calc(var(--c)*.08);background:repeating-linear-gradient(90deg,transparent 0 calc(var(--c) - 1px),rgba(0,0,0,.12) 0 var(--c)),repeating-linear-gradient(0deg,transparent 0 calc(var(--c) - 1px),rgba(0,0,0,.12) 0 var(--c)),#cfa477}
.dz[data-skin="ciudad"] .dz-board{background:linear-gradient(#5b6270,#454b57);box-shadow:inset 0 0 0 calc(var(--c)*.06) #2e333c,0 14px 34px rgba(0,0,0,.5)}
.dz[data-skin="ciudad"] .dz-board::before{background:repeating-linear-gradient(90deg,transparent 0 calc(var(--c) - 2px),rgba(255,255,255,.08) 0 var(--c)),repeating-linear-gradient(0deg,transparent 0 calc(var(--c) - 2px),rgba(255,255,255,.08) 0 var(--c)),#3a3f49}
.dz[data-skin="neon"] .dz-board{background:#120e26;box-shadow:inset 0 0 0 2px #6b4dff,0 0 28px rgba(107,77,255,.45)}
.dz[data-skin="neon"] .dz-board::before{background:repeating-linear-gradient(90deg,transparent 0 calc(var(--c) - 1px),rgba(140,120,255,.14) 0 var(--c)),repeating-linear-gradient(0deg,transparent 0 calc(var(--c) - 1px),rgba(140,120,255,.14) 0 var(--c)),#0b0918}
.dz-exit{position:absolute;background:inherit;display:grid;place-items:center;color:#fff;font-weight:900;font-size:calc(var(--c)*.32);text-shadow:0 1px 2px rgba(0,0,0,.5)}
.dz-exit.r{right:calc(var(--c)*-.02);width:calc(var(--c)*.16);top:calc(var(--c)*(.12 + var(--ey)));height:var(--c);background:#2a1d12;border-radius:0 6px 6px 0}
.dz-exit.r i{position:absolute;left:calc(var(--c)*.34);font-style:normal;animation:dzArr 1.4s ease-in-out infinite}
.dz-exit.b{bottom:calc(var(--c)*-.02);height:calc(var(--c)*.16);left:calc(var(--c)*(.12 + 1));width:calc(var(--c)*2);background:#2a1d12;border-radius:0 0 6px 6px}
.dz-exit.b i{position:absolute;top:calc(var(--c)*.18);font-style:normal;animation:dzArr2 1.4s ease-in-out infinite}
.dz[data-skin="neon"] .dz-exit{background:#ff4d8d;box-shadow:0 0 16px #ff4d8d}
@keyframes dzArr{50%{transform:translateX(5px)}}@keyframes dzArr2{50%{transform:translateY(5px)}}
.dz-p{position:absolute;left:calc(var(--c)*.12);top:calc(var(--c)*.12);width:calc(var(--w)*var(--c) - var(--c)*.1);height:calc(var(--h)*var(--c) - var(--c)*.1);margin:calc(var(--c)*.05);box-sizing:border-box;border-radius:calc(var(--c)*.16);transform:translate(calc(var(--x)*var(--c)),calc(var(--y)*var(--c)));transition:transform .16s cubic-bezier(.3,.8,.4,1),box-shadow .15s,filter .15s;cursor:grab;background:linear-gradient(160deg,color-mix(in srgb,var(--pc) 78%,#fff),var(--pc) 45%,color-mix(in srgb,var(--pc) 70%,#000));box-shadow:inset 0 2px 0 rgba(255,255,255,.35),inset 0 -3px 0 rgba(0,0,0,.25),0 4px 8px rgba(0,0,0,.35)}
.dz-p::after{content:'';position:absolute;inset:18%;border-radius:calc(var(--c)*.1);background:repeating-linear-gradient(var(--grain,90deg),rgba(255,255,255,.07) 0 3px,transparent 3px 9px)}
.dz-p.v{--grain:0deg}
.dz-p.t{--pc:#d8342c!important}
.dz-p.t::after{inset:auto;left:50%;top:50%;width:calc(var(--c)*.36);height:calc(var(--c)*.36);transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,#fff 0 30%,transparent 32%),rgba(255,255,255,.28)}
.dz-p.drag{transition:box-shadow .15s,filter .15s;cursor:grabbing;z-index:3;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),inset 0 -3px 0 rgba(0,0,0,.25),0 10px 20px rgba(0,0,0,.45);filter:brightness(1.08)}
.dz-p.sel{outline:3px solid #ffd34d;outline-offset:2px}
.dz-p.hint{animation:dzHint .7s ease-in-out 3}
@keyframes dzHint{50%{filter:brightness(1.5) drop-shadow(0 0 10px #ffd34d)}}
.dz[data-skin="ciudad"] .dz-p{border-radius:calc(var(--c)*.22)}
.dz[data-skin="ciudad"] .dz-p::after{inset:20% 16%;border-radius:calc(var(--c)*.12);background:linear-gradient(var(--grain,90deg),rgba(30,40,55,.75) 0 22%,rgba(255,255,255,.18) 22% 78%,rgba(30,40,55,.75) 78%)}
.dz[data-skin="ciudad"] .dz-p.v::after{--grain:180deg}
.dz[data-skin="ciudad"] .dz-p.t::after{inset:20% 16%;left:auto;top:auto;width:auto;height:auto;transform:none;border-radius:calc(var(--c)*.12);background:linear-gradient(90deg,rgba(30,40,55,.75) 0 22%,rgba(255,255,255,.18) 22% 78%,rgba(30,40,55,.75) 78%)}
.dz[data-skin="ciudad"] .dz-p.k::after{background:linear-gradient(180deg,rgba(30,40,55,.75) 0 22%,rgba(255,255,255,.18) 22% 78%,rgba(30,40,55,.75) 78%)}
.dz[data-skin="neon"] .dz-p{background:color-mix(in srgb,var(--pc) 22%,#0b0918);box-shadow:inset 0 0 0 2px var(--pc),0 0 12px color-mix(in srgb,var(--pc) 70%,transparent)}
.dz[data-skin="neon"] .dz-p::after{background:none;border:1px dashed color-mix(in srgb,var(--pc) 60%,transparent)}
.dz[data-skin="neon"] .dz-p.t{--pc:#ff4d8d!important}
.dz-p.out{transition:transform .45s cubic-bezier(.5,0,.8,.4),opacity .45s;opacity:0}
.dz-side{display:grid;align-content:start;gap:10px;min-width:0;min-height:0;overflow:auto}
.dz-card{background:rgba(0,0,0,.26);border-radius:14px;padding:12px 14px;display:grid;gap:6px}
.dz-card h3{margin:0;font-size:15px}
.dz-card p{margin:0;font-size:12.5px;opacity:.8;line-height:1.35}
.dz-nums{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center}
.dz-nums div{background:rgba(255,255,255,.07);border-radius:10px;padding:6px 2px;font-size:11px;opacity:.95}
.dz-nums b{display:block;font-size:20px;color:#ffd34d}
.dz-acts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.dz-b{border:0;border-radius:10px;padding:8px 4px;font:inherit;font-size:12.5px;font-weight:700;color:#1d1611;background:#f1e3cc;cursor:pointer}
.dz-b:hover{filter:brightness(1.06)}.dz-b:disabled{opacity:.45;cursor:default}
.dz-b.hot{background:#ffd34d}
.dz-tabs{display:flex;gap:4px;flex-wrap:wrap}
.dz-tabs button{flex:1;border:0;border-radius:8px;padding:5px 4px;font:inherit;font-size:11.5px;font-weight:700;color:#f4f1ea;background:rgba(255,255,255,.08);cursor:pointer}
.dz-tabs button.on{background:#ffd34d;color:#1d1611}
.dz-lv{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}
.dz-lv button{border:0;border-radius:7px;aspect-ratio:1;max-height:34px;font:inherit;font-size:11.5px;font-weight:700;color:#f4f1ea;background:rgba(255,255,255,.08);cursor:pointer;position:relative;padding:0}
.dz-lv button.done{background:rgba(70,163,94,.55)}
.dz-lv button.star::after{content:'★';position:absolute;top:-3px;right:0;font-size:9px;color:#ffd34d}
.dz-lv button.on{outline:2px solid #ffd34d;outline-offset:1px}
.dz-msg{font-size:12.5px;min-height:16px;color:#ffd34d;font-weight:700}
@media (max-height:640px){.dz-card{padding:8px 10px;gap:4px}.dz-card p{display:none}.dz-nums b{font-size:16px}.dz-lv button{aspect-ratio:auto;height:24px}}
@media (max-width:640px){.dz{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto}.dz-side{max-height:42vh}}
`;
  // ---------- piezas ----------
  function parse(mode, b) {
    const { W, H } = MODES[mode], P = {};
    for (let i = 0; i < W * H; i++) { const c = b[i]; if (c === '.') continue; (P[c] = P[c] || []).push(i); }
    return Object.keys(P).sort().map(k => {
      const c = P[k], xs = c.map(i => i % W), ys = c.map(i => Math.floor(i / W));
      const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x + 1, hh = Math.max(...ys) - y + 1;
      return { k, x, y, w, h: hh, axis: mode === 'k' ? 'b' : (w > 1 ? 'h' : 'v') };
    });
  }
  const grid = (mode, pcs, pos, skip = -1) => {
    const { W, H } = MODES[mode], g = new Int8Array(W * H).fill(-1);
    pcs.forEach((p, i) => { if (i === skip) return; const [x, y] = pos[i]; for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) g[(y + dy) * W + x + dx] = i; });
    return g;
  };
  const fits = (mode, p, x, y, g) => {
    const { W, H } = MODES[mode]; if (x < 0 || y < 0 || x + p.w > W || y + p.h > H) return false;
    for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) if (g[(y + dy) * W + x + dx] !== -1) return false;
    return true;
  };
  // adónde puede ir una pieza en un movimiento
  function reach(mode, pcs, pos, i) {
    const p = pcs[i], g = grid(mode, pcs, pos, i), [x0, y0] = pos[i], out = [];
    if (mode === 'k') {
      const seen = new Set([x0 + ',' + y0]), q = [[x0, y0]];
      while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, key = nx + ',' + ny; if (seen.has(key) || !fits(mode, p, nx, ny, g)) continue; seen.add(key); q.push([nx, ny]); out.push([nx, ny]); } }
      return out;
    }
    const [dx, dy] = p.axis === 'h' ? [1, 0] : [0, 1];
    for (const s of [-1, 1]) {
      let x = x0, y = y0, last = null;
      while (fits(mode, p, x + dx * s, y + dy * s, g)) { x += dx * s; y += dy * s; if (mode === 'rush') out.push([x, y]); last = [x, y]; }
      if (mode === 'ice' && last) out.push(last);
    }
    return out;
  }
  const won = (mode, pcs, pos) => mode === 'k' ? pos[0][0] === 1 && pos[0][1] === 3 : pos[0][0] === MODES[mode].W - pcs[0].w;
  // pista: el primer paso de un camino más corto desde donde está el tablero ahora
  function solveFrom(mode, pcs, pos) {
    const key = (s) => { if (mode !== 'k') return s.map(p => p[0] + p[1] * 8).join(','); const gr = {}; pcs.forEach((p, i) => { const t = i ? p.w + 'x' + p.h : 'A'; (gr[t] = gr[t] || []).push(s[i][1] * 4 + s[i][0]); }); return Object.keys(gr).sort().map(t => t + gr[t].sort((a, b) => a - b).join('.')).join('|'); };
    const start = pos.map(p => p.slice()); if (won(mode, pcs, start)) return null;
    const seen = new Set([key(start)]); let q = [[start, null]];
    for (let d = 0; d < 300 && q.length; d++) {
      const nq = [];
      for (const [s, first] of q) {
        for (let i = 0; i < pcs.length; i++) for (const np of reach(mode, pcs, s, i)) {
          const ns = s.slice(); ns[i] = np; const k = key(ns); if (seen.has(k)) continue; seen.add(k);
          const f = first || { i, to: np };
          if (won(mode, pcs, ns)) return { ...f, left: d + 1 };
          nq.push([ns, f]);
        }
        if (seen.size > 600000) return null;
      }
      q = nq;
    }
    return null;
  }
  function destraba(H) {
    const st = document.getElementById('st-dz') || document.head.appendChild(h('style', { id: 'st-dz' })); if (st.textContent !== CSS) st.textContent = CSS;
    const root = h('div', { class: 'dz' });
    const S = () => { const s = H.get(); s.done = s.done || {}; s.at = s.at || {}; return s; };
    let mode = S().mode in MODES ? S().mode : 'rush';
    let tier = 0, idx = 0, pcs = [], pos = [], hist = [], moves = 0, lastPiece = -1, sel = -1, over = false, msg = '', min = 0;
    const list = (m, t) => LV[m][t] || [];
    function load(m, t, i) {
      mode = m; tier = Math.max(0, Math.min(3, t)); const L = list(mode, tier); idx = Math.max(0, Math.min(L.length - 1, i));
      const [b, mm] = L[idx]; min = mm; pcs = parse(mode, b); pos = pcs.map(p => [p.x, p.y]);
      hist = []; moves = 0; lastPiece = -1; sel = -1; over = false; msg = '';
      const s = S(); s.mode = mode; s.at[mode] = [tier, idx]; s.at[mode + tier] = idx; H.set(s);
      build(); status();
    }
    const id = () => `${mode}:${tier}:${idx}`;
    const status = () => { const b = S().done[id()]; H.status([MODES[mode].n, `${TIERS[tier]} ${idx + 1}`, `Movimientos ${moves}`, b ? `Tu mejor ${b}` : `Mínimo ${min}`]); };
    // ---------- dibujo ----------
    let board, stage, side, pieceEls = [];
    const place = (i, x, y) => { const e = pieceEls[i]; e.style.setProperty('--x', x); e.style.setProperty('--y', y); };
    function build() {
      const { W, H: HH } = MODES[mode];
      board = h('div', { class: 'dz-board', style: `--W:${W + .24};--H:${HH + .24}` });
      if (mode === 'k') board.append(h('div', { class: 'dz-exit b' }, h('i', { text: '▼' })));
      else board.append(h('div', { class: 'dz-exit r', style: `--ey:${pcs[0].y}` }, h('i', { text: '▶' })));
      let ci = 0;
      pieceEls = pcs.map((p, i) => {
        const e = h('div', { class: 'dz-p ' + (i === 0 ? 't ' : '') + (p.axis === 'h' ? 'h' : p.axis === 'v' ? 'v' : (p.h > p.w ? 'v k' : 'h')), style: `--w:${p.w};--h:${p.h};--pc:${i === 0 ? '#d8342c' : COLS[ci++ % COLS.length]}` });
        e.addEventListener('pointerdown', (ev) => down(ev, i));
        board.append(e); return e;
      });
      pos.forEach((p, i) => place(i, p[0], p[1]));
      stage = h('div', { class: 'dz-stage' }, board);
      side = h('div', { class: 'dz-side' });
      root.replaceChildren(stage, side);
      renderSide(); fit();
    }
    function renderSide() {
      const s = S(), L = list(mode, tier), best = s.done[id()];
      const tabs = h('div', { class: 'dz-tabs' }, ...TIERS.map((t, i) => Object.assign(h('button', { class: i === tier ? 'on' : '', text: t }), { onclick: () => { const at = (S().at[mode + i]) || 0; load(mode, i, at); } })));
      const lv = h('div', { class: 'dz-lv' }, ...L.map(([, mm], i) => {
        const d = s.done[`${mode}:${tier}:${i}`];
        return Object.assign(h('button', { class: (i === idx ? 'on ' : '') + (d ? 'done ' : '') + (d && d <= mm ? 'star' : ''), text: String(i + 1), title: `Nivel ${i + 1} · se puede en ${mm}` + (d ? ` · tu mejor: ${d}` : '') }), { onclick: () => load(mode, tier, i) });
      }));
      const B = (t, fn, ok = true, cls = '') => Object.assign(h('button', { class: 'dz-b ' + cls, text: t, disabled: !ok }), { onclick: fn });
      side.replaceChildren(
        h('div', { class: 'dz-card' }, h('h3', { text: `${MODES[mode].n} · ${TIERS[tier]} ${idx + 1}` }), h('p', { text: MODES[mode].d })),
        h('div', { class: 'dz-card' },
          h('div', { class: 'dz-nums' }, h('div', {}, h('b', { text: String(moves) }), 'Movimientos'), h('div', {}, h('b', { text: String(min) }), 'Se puede en'), h('div', {}, h('b', { text: best ? String(best) : '–' }), 'Tu mejor')),
          h('div', { class: 'dz-acts' }, B('Deshacer', undo, hist.length > 0 && !over), B('Reiniciar', () => load(mode, tier, idx), moves > 0), B('Pista', hint, !over, 'hot')),
          h('div', { class: 'dz-acts', style: 'grid-template-columns:1fr 1fr' }, B('◀ Anterior', () => step(-1), tier > 0 || idx > 0), B('Siguiente ▶', () => step(1), tier < 3 || idx < L.length - 1)),
          h('div', { class: 'dz-msg', text: msg })),
        h('div', { class: 'dz-card' }, tabs, lv)
      );
    }
    function step(d) {
      let t = tier, i = idx + d;
      if (i < 0) { if (t === 0) return; t--; i = list(mode, t).length - 1; }
      if (i >= list(mode, t).length) { if (t === 3) return; t++; i = 0; }
      const s = S(); s.at[mode + t] = i; H.set(s); load(mode, t, i);
    }
    function fit() {
      if (!board) return; const { W, H: HH } = MODES[mode];
      const r = stage.getBoundingClientRect(); if (!r.width) return;
      const c = Math.max(28, Math.min(96, Math.min((r.width - 24) / (W + .24), (r.height - 24) / (HH + .24))));
      root.style.setProperty('--c', c + 'px');
    }
    new ResizeObserver(() => requestAnimationFrame(fit)).observe(root);
    // ---------- jugar ----------
    function commit(i, to) {
      if (to[0] === pos[i][0] && to[1] === pos[i][1]) { place(i, to[0], to[1]); return; }
      hist.push({ pos: pos.map(p => p.slice()), moves, lastPiece });
      pos[i] = to.slice(); place(i, to[0], to[1]);
      if (i !== lastPiece) moves++; lastPiece = i; msg = '';
      SFX('place');
      pieceEls.forEach(e => e.classList.remove('hint'));
      status();
      if (won(mode, pcs, pos)) win(); else renderSide();
    }
    function undo() { const u = hist.pop(); if (!u) return; pos = u.pos; moves = u.moves; lastPiece = u.lastPiece; pos.forEach((p, i) => place(i, p[0], p[1])); SFX('tap'); status(); renderSide(); }
    function hint() {
      if (over) return; msg = 'Pensando…'; renderSide();
      setTimeout(() => {
        const r = solveFrom(mode, pcs, pos);
        if (!r) { msg = 'No encontré una pista'; renderSide(); return; }
        msg = `Faltan ${r.left} movimiento${r.left === 1 ? '' : 's'}: mové la pieza que brilla`;
        renderSide();
        const e = pieceEls[r.i]; e.classList.remove('hint'); void e.offsetWidth; e.classList.add('hint');
        setTimeout(() => { if (!over && pos[r.i]) commit(r.i, r.to); }, 900);
      }, 30);
    }
    function win() {
      over = true; const s = S(), k = id(), prev = s.done[k];
      if (!prev || moves < prev) s.done[k] = moves; s.solved = Object.keys(s.done).length; H.set(s);
      const e = pieceEls[0]; e.classList.add('out');
      if (mode === 'k') place(0, 1, 5.4); else place(0, MODES[mode].W + 1.2, pos[0][1]);
      SFX('whoosh'); renderSide(); status();
      setTimeout(() => {
        if (moves <= min) confetti(root);
        const sub = moves <= min ? `En ${moves} movimientos: ¡el mínimo posible!` : `En ${moves} movimientos. Se puede en ${min}.`;
        const L = list(mode, tier), last = tier === 3 && idx === L.length - 1;
        overlay(root, moves <= min ? '¡Perfecto, lo sacaste!' : '¡Listo, lo sacaste!', sub, [
          btn('Otra vez', () => load(mode, tier, idx)),
          last ? null : btn('Siguiente nivel', () => step(1), 'primary')
        ].filter(Boolean));
      }, 480);
    }
    function down(ev, i) {
      if (over || ev.button > 0) return; ev.preventDefault();
      const e = pieceEls[i], c = parseFloat(getComputedStyle(root).getPropertyValue('--c')) || 60;
      const p = pcs[i], [x0, y0] = pos[i], sx = ev.clientX, sy = ev.clientY, opts = reach(mode, pcs, pos, i);
      sel = i; pieceEls.forEach((el, j) => el.classList.toggle('sel', j === i));
      let cur = [x0, y0], moved = false;
      e.setPointerCapture(ev.pointerId); e.classList.add('drag'); SFX('select');
      // en el clásico la pieza sigue al dedo entre sus topes
      let lo = 0, hi = 0;
      if (mode === 'rush') { const along = p.axis === 'h' ? 0 : 1; const vals = opts.map(o => o[along]).concat([pos[i][along]]); lo = Math.min(...vals); hi = Math.max(...vals); }
      const mv = (m) => {
        const dx = (m.clientX - sx) / c, dy = (m.clientY - sy) / c;
        if (Math.abs(dx) + Math.abs(dy) > .15) moved = true;
        if (mode === 'rush') {
          if (p.axis === 'h') { const x = Math.max(lo, Math.min(hi, x0 + dx)); place(i, x, y0); cur = [Math.round(x), y0]; }
          else { const y = Math.max(lo, Math.min(hi, y0 + dy)); place(i, x0, y); cur = [x0, Math.round(y)]; }
        } else if (mode === 'k') {
          const tx = x0 + dx, ty = y0 + dy; let best = [x0, y0], bd = Math.hypot(dx, dy);
          for (const o of opts) { const d = Math.hypot(o[0] - tx, o[1] - ty); if (d < bd - .05) { bd = d; best = o; } }
          if (best[0] !== cur[0] || best[1] !== cur[1]) { cur = best; place(i, best[0], best[1]); SFX('move'); }
        } else {
          // sobre hielo: alcanza con marcar el sentido y la pieza patina sola
          const a = p.axis === 'h' ? dx : dy;
          if (Math.abs(a) > .3) { const s = Math.sign(a); const o = opts.find(o => (p.axis === 'h' ? o[0] - x0 : o[1] - y0) * s > 0); cur = o || [x0, y0]; place(i, cur[0], cur[1]); }
          else { cur = [x0, y0]; place(i, x0, y0); }
        }
      };
      const up = () => {
        e.removeEventListener('pointermove', mv); e.removeEventListener('pointerup', up); e.removeEventListener('pointercancel', up);
        e.classList.remove('drag'); commit(i, cur);
        if (!moved) sel = i;
      };
      e.addEventListener('pointermove', mv); e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up);
    }
    // teclado: Tab o Espacio elige pieza, flechas la mueven, Z deshace, R reinicia, H pista
    const keys = (ev) => {
      if (!root.isConnected || ev.target.closest('input,select,textarea')) return;
      const k = ev.key.toLowerCase();
      if (k === 'z' || k === 'backspace') { ev.preventDefault(); undo(); return; }
      if (k === 'r') { load(mode, tier, idx); return; }
      if (k === 'h') { hint(); return; }
      if (k === 'n' && over) { step(1); return; }
      if (over) return;
      if (k === 'tab' || k === ' ') { ev.preventDefault(); sel = (sel + (ev.shiftKey ? pcs.length - 1 : 1)) % pcs.length; if (sel < 0) sel = 0; pieceEls.forEach((el, j) => el.classList.toggle('sel', j === sel)); return; }
      const dir = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k]; if (!dir) return;
      ev.preventDefault(); if (sel < 0) { sel = 0; pieceEls[0].classList.add('sel'); }
      const p = pcs[sel], g = grid(mode, pcs, pos, sel), [x, y] = pos[sel];
      if (p.axis === 'h' && dir[1]) return; if (p.axis === 'v' && dir[0]) return;
      if (mode === 'ice') { let nx = x, ny = y; while (fits(mode, p, nx + dir[0], ny + dir[1], g)) { nx += dir[0]; ny += dir[1]; } commit(sel, [nx, ny]); }
      else if (fits(mode, p, x + dir[0], y + dir[1], g)) commit(sel, [x + dir[0], y + dir[1]]);
    };
    addEventListener('keydown', keys);
    const at = S().at[mode] || [0, 0];
    requestAnimationFrame(() => load(mode, at[0], at[1]));
    const tools = [pick('Versión', Object.entries(MODES).map(([k, m]) => [k, m.n]), mode, (v) => { const a = S().at[v] || [0, 0]; load(v, a[0], a[1]); })];
    return { el: root, tools, help: 'Destrabá: sacá el bloque rojo. En el Clásico cada pieza se desliza sólo a lo largo (las acostadas a los costados, las paradas para arriba y abajo) y el rojo sale por la derecha. Sobre hielo las piezas patinan hasta chocar. En Bloque grande todo se mueve para cualquier lado y el bloque grande sale por abajo. Arrastrá las piezas con el mouse o el dedo; con el teclado, Tab elige pieza y las flechas la mueven. Z deshace, R reinicia y H da una pista. Mover la misma pieza varias veces seguidas cuenta como un solo movimiento.', pad: { a: ' ', b: 'z', x: 'h' } };
  }
  BM.register({ id: 'destraba', n: 'Destrabá', d: 'Sacá el bloque deslizando las demás piezas. Tres versiones: clásico, sobre hielo y bloque grande, con cientos de niveles.', c: '#a8442e', create: destraba,
    skinLabel: 'Estilo', skins: [['madera', 'Madera', '#b9875a'], ['ciudad', 'Ciudad', '#454b57'], ['neon', 'Neón', '#6b4dff']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#9c6c42"/><rect x="6" y="6" width="52" height="52" rx="4" fill="#cfa477"/><rect x="8" y="8" width="7" height="22" rx="2.5" fill="#3f8fd6"/><rect x="17" y="8" width="24" height="7" rx="2.5" fill="#46a35e"/><rect x="42" y="8" width="7" height="22" rx="2.5" fill="#8b5fd0"/><rect x="10" y="25" width="22" height="9" rx="3" fill="#d8342c"/><rect x="34" y="36" width="7" height="20" rx="2.5" fill="#e0a33a"/><rect x="8" y="46" width="24" height="9" rx="2.5" fill="#2fa8a0"/><path d="M58 25v10l4-5z" fill="#fff"/><path d="M52 30h6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>',
    best: (s) => { const n = Object.keys(s.done || {}).length; return n ? `${n} nivel${n === 1 ? '' : 'es'} resuelto${n === 1 ? '' : 's'}` : 'Nunca jugaste'; } });
})();
