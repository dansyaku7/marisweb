export function terbilang(nilai: number): string {
  const angka = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let temp = "";
  
  if (nilai < 12) {
    temp = " " + angka[nilai];
  } else if (nilai < 20) {
    temp = terbilang(nilai - 10) + " Belas";
  } else if (nilai < 100) {
    temp = terbilang(Math.floor(nilai / 10)) + " Puluh" + terbilang(nilai % 10);
  } else if (nilai < 200) {
    temp = " Seratus" + terbilang(nilai - 100);
  } else if (nilai < 1000) {
    temp = terbilang(Math.floor(nilai / 100)) + " Ratus" + terbilang(nilai % 100);
  } else if (nilai < 2000) {
    temp = " Seribu" + terbilang(nilai - 1000);
  } else if (nilai < 1000000) {
    temp = terbilang(Math.floor(nilai / 1000)) + " Ribu" + terbilang(nilai % 1000);
  } else if (nilai < 1000000000) {
    temp = terbilang(Math.floor(nilai / 1000000)) + " Juta" + terbilang(nilai % 1000000);
  } else if (nilai < 1000000000000) {
    temp = terbilang(Math.floor(nilai / 1000000000)) + " Miliar" + terbilang(nilai % 1000000000);
  }

  return temp.trim();
}

export function formatTerbilang(nilai: number): string {
    return terbilang(nilai) + " Rupiah";
}