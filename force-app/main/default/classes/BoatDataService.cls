public with sharing class BoatDataService {
  // get boat items via boat type
  @AuraEnabled(cacheable=true)
  public static List<Boat__c> getBoats(String boatTypeId) {
    try {
      if (String.isBlank(boatTypeId)) {
        return [
          SELECT
            Id,
            Name,
            Boat_Image__c,
            CreatedById,
            Description__c,
            Geolocation__c,
            Length__c,
            Picture__c,
            Price__c,
            Year_Built__c
          FROM Boat__c
          WITH SECURITY_ENFORCED
          ORDER BY Name
        ];
      } else {
        return [
          SELECT
            Id,
            Name,
            Boat_Image__c,
            CreatedById,
            Description__c,
            Geolocation__c,
            Length__c,
            Picture__c,
            Price__c,
            Year_Built__c
          FROM Boat__c
          WHERE BoatType__c = :boatTypeId
          WITH SECURITY_ENFORCED
          ORDER BY Name
        ];
      }
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  // get similar boats with current boat
  @AuraEnabled(cacheable=true)
  public static List<Boat__c> getSimilarBoats(Id boatId, String similarBy) {
    try {
      return [
        SELECT
          Id,
          Name,
          Boat_Image__c,
          CreatedById,
          Description__c,
          Geolocation__c,
          Length__c,
          Picture__c,
          Price__c,
          Year_Built__c
        FROM Boat__c
        WHERE Id = :boatId AND BoatType__c = :similarBy
        WITH SECURITY_ENFORCED
        ORDER BY Name
      ];
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  // get type of boat
  @AuraEnabled(cacheable=true)
  public static List<BoatType__c> getBoatTypes() {
    try {
      return [
        SELECT Id, Name
        FROM BoatType__c
        WITH SECURITY_ENFORCED
        ORDER BY Name
      ];
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  // get boat reviews
  @AuraEnabled
  public static List<BoatReview__c> getAllReviews(Id boatId) {
    try {
      return [
        SELECT Id, Name, Comment__c, CreatedById, LastModifiedById, Rating__c
        FROM BoatReview__c
        WHERE Boat__c = :boatId
        WITH SECURITY_ENFORCED
        ORDER BY Name
      ];
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled(cacheable=true)
  public static List<Boat__c> getBoatsByLocation(
    Decimal latitude,
    Decimal longitude,
    String boatTypeId
  ) {
    try {
      String query =
        'SELECT Id, Name, Geolocation__Latitude__s, Geolocation__Longitude__s FROM Boat__c' +
        'WHERE DISTANCE(Geolocation__c, GEOLOCATION(:latitude, :longitude), \'km\') < 20';

      if (String.isBlank(boatTypeId)) {
        query += ' AND BoatType__c = ' + String.escapeSingleQuotes(boatTypeId);
      }

      query += 'WITH SECURITY_ENFORCED ORDER BY DISTANCE(Geolocation__c, GEOLOCATION(:latitude, :longitude), \'km\') LIMIT 10';
      return Database.query(String.escapeSingleQuotes(query));
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static string updateBoatList(Object boatsData) {
    String updateStatus = '';
    try {
      if (Boat__c.sObjectType.getDescribe().isUpdateable()) {
        List<Boat__c> boats = (List<Boat__c>) JSON.deserialize(
          JSON.serialize(boatsData),
          List<Boat__c>.class
        );
        update boats;
        updateStatus = 'boats update success!';
      } else {
        updateStatus = 'dont have permistion to update this table!';
      }
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
    return updateStatus;
  }
}
