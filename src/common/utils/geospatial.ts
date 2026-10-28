export class GeospatialUtil {
  /**
   * Calculates the great-circle distance between two points on the Earth (Haversine formula).
   * @returns Distance in kilometers
   */
  public static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculates a 0-100 geographic suitability score between a problem location and an institution.
   * Within same district = 100
   * Within 50km = 90
   * Within 100km = 75
   * Within 200km = 50
   * Within 400km = 25
   * > 400km = 10
   */
  public static scoreGeographicSuitability(
    problemLat?: number | null,
    problemLon?: number | null,
    problemDistrict?: string | null,
    instLat?: number | null,
    instLon?: number | null,
    instDistrict?: string | null
  ): number {
    if (problemDistrict && instDistrict && problemDistrict.toLowerCase().trim() === instDistrict.toLowerCase().trim()) {
      return 100;
    }

    if (
      problemLat != null &&
      problemLon != null &&
      instLat != null &&
      instLon != null
    ) {
      const distance = this.calculateDistanceKm(problemLat, problemLon, instLat, instLon);
      if (distance <= 25) return 95;
      if (distance <= 50) return 85;
      if (distance <= 100) return 70;
      if (distance <= 200) return 50;
      if (distance <= 400) return 30;
      return 15;
    }

    // Default if coordinates not available but in same state
    return 50;
  }
}

