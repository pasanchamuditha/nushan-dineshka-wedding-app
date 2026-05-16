export interface GuestRecord {
  name: string;
  table: string;
  tableNumber: number;
  tablemates: string[];
}

export interface TableData {
  [tableName: string]: string[];
}

// Updated seating data from "ne seating plan paszaaaan .xlsx" — Invitees - Nushan sheet
export const SEATING_DATA: TableData = {
  "Table 1": [
    "Mr. Tharindu Dassanayake",
    "Mrs. Danoja Dias",
    "Mr. Asanka Jayasinghe",
    "Mrs. Ruchira Karunaratne",
    "Mr. Pathum Jayatissa",
    "Mrs. Sathsala Oshadhi",
    "Mr. Madura Pradeep",
    "Mr. Joey Sarith",
  ],
  "Table 2": [
    "Mr. Maduranga Ginigaddara",
    "Mr. Sujan Jayasinghe",
    "Mrs. Hansi Devini",
    "Mr. Bhanuka Pramod",
    "Mrs. Piyumi Weerasinghe",
    "Mr. Chirath Jayasri",
    "Mr. Ramith Perera",
    "Ms. Rehani Perera",
    "Mr. Thilina WarnaKulasuriya",
  ],
  "Table 3": [
    "Mr. Kanishka Weeramunda",
    "Mrs. Nilma Weeramunda",
    "Ms. Nethmi Liyanage",
    "Mr. Sasindu Pathiranage",
    "Mr. Hiroshan Samarathunga",
    "Mr. Dhammika Dasa",
    "Mr. Sanath Siriwardana",
    "Mrs. Shivanthi Subramaniam",
  ],
  "Table 4": [
    "Mr. Dinesh Karunatilaka",
    "Mr. Thilanga Liyanage",
    "Mrs. Nalika Malwattegoda",
    "Ms. Senuli Dinethma",
    "Mrs. Maleesha Perera",
    "Mr. Chamath Ariyawansa",
    "Mr. Channa Senarathna",
    "Mrs. Shishara Amarakoon",
  ],
  "Table 5": [
    "Mr. Induwara Wickramasinghe",
    "Mr. Janindu Ranawake",
    "Mr. Yoman Bandara",
    "Mr. Bhagya Viduranga",
    "Mr. Lahiru Prabudda",
    "Mrs. Sepali Amarakoon",
    "Mr. Gunasena Weerasinghe",
  ],
  "Table 6": [
    "Mr. Savindu Nirman",
    "Mrs. Madhuni Dilanka",
    "Mr. Anjula Wiraj",
    "Mr. Primal Sampath",
    "Mr. Tharindu Dilshan",
    "Mr. Chamod Chandrasekara",
    "Mr. Ajith Kumara",
    "Mrs. Kusala Manjari",
    "Mr. Isuru Kothalawala",
  ],
  "Table 7": [
    "Mr. Pasan Weerasinghe",
    "Mr. Chamika Abesiriwardhana",
    "Mr. Kanchana Abesiriwardhana",
    "Mr. Ravindu Akalanka",
    "Mr. Nuwan Madushanka",
    "Mr. Nuwan Chathura",
    "Mr. Iduwara Wikramasinha",
    "Mr. Kalpa Silva",
    "Mr. Kawidu Samarathunga",
  ],
  "Table 8": [
    "Mrs. Dilrukshi Madumali",
    "Mr. Dimuthu Jayasuriya",
    "Ms. Dinushani Surangika",
    "Ms. Lakshika Madushani",
    "Mrs. Sudharika Jayawardane",
    "Ms. Tharushi Nethmi",
    "Mr. Lasith Ranathunga",
    "Mr. Teshan Bhanuka",
    "Mr. M. Prasad",
    "Mr. Dinusha Madhushan",
  ],
  "Table 9": [
    "Mr. Vikum Dilashan",
    "Mr. Ajith Janaka",
    "Mr. Tharanga Pradeep",
    "Mr. Rohith",
    "Mr. Tharindu Dilshan",
    "Mr. Sugath",
    "Mr. Eshan Dilruk",
    "Mr. Danushka Sandaruwan",
    "Mr. Sugath Nishantha",
    "Mr. Buddika Indrajith",
  ],
  "Table 10": [
    "Mr. Anura Amarakoon",
    "Mrs. Mangalika Weeramen",
    "Ranudi Amarakoon",
    "Minudi Amarakoon",
    "Ms. Sunitha Amarakoon",
    "Mrs. Wimalawathi Amarakoon",
    "Mr. Viktor Kodhagoda",
    "Mrs. Chandra Karunarathna",
    "Mr. Somapala Weerasinghe",
    "Mr. Randika Umayanga",
  ],
  "Table 11": [
    "Mrs. Kanthi Amarakoon",
    "Mr. Sirisena Samarathunga",
    "Mrs. Kavindi Prabodhani",
    "Mr. Rusath Prabashwara",
    "Mrs. Mangalika Amarakoon",
    "Mr. Hirantha Vishwavimukthi",
    "Mr. Nesadu Vishwavimukthi",
    "Mrs. Pawitra Sammani",
    "Mr. Karunarathna Alahakoon",
    "Mr. Rasika Nuwan",
  ],
  "Table 12": [
    "Mrs. Niluka Damayanthi",
    "Mr. Rathnapala Welhenage",
    "Mrs. Pemawathi Gamage",
    "Ms. Senudi Amaya",
    "Ms. Nethuli Sahanya",
    "Mrs. Hashini Imalka",
    "Mr. Oshan Chamika",
    "Ms. Chathurika Priyadharsani",
    "Ms. Shashikala Sewwandi",
    "Mrs. Nilupa Nishani",
  ],
  "Table 13": [
    "Mr. Jagath Kumara",
    "Mr. Gavindu",
    "Ms. Ruhini",
    "Mrs. Renuka Damayanthi",
    "Mr. Roshan",
    "Mr. Induwara",
    "Mr. Sameera",
    "Mr. Kamalasiri",
    "Mr. Piyadasa",
    "Mr. Ruvan Roy",
  ],
  "Table 14": [
    "Mr. Nagarathna",
    "Mr. Buddadasa",
    "Mr. Kirthipala",
    "Mr. Gamage Thilakasiri",
    "Ms. Salani Uthpala",
    "Mr. Dushantha",
    "Mr. Ranasinha",
    "Mr. Imal Sathsara",
    "Mrs. Welhenage Wasanthi",
    "Mr. Rathnasiri",
  ],
  "Table 15": [
    "Mrs. Janaki",
    "Mrs. I.D. Sujani",
    "Mrs. Yureka Wijesingha",
    "Mrs. Shanthi Palliyaguru",
    "Mrs. Sudeshani",
    "Mrs. Mangalika",
    "Mrs. Irangani",
    "Mrs. Sriyani",
    "Ms. Hirunika Manavi",
    "Mrs. Gayani",
  ],
};

export function buildGuestIndex(data: TableData): GuestRecord[] {
  const records: GuestRecord[] = [];
  Object.entries(data).forEach(([tableName, guests]) => {
    const tableNumber = parseInt(tableName.replace("Table ", ""), 10);
    guests.forEach((name) => {
      records.push({
        name,
        table: tableName,
        tableNumber,
        tablemates: guests.filter((g) => g !== name),
      });
    });
  });
  return records;
}
