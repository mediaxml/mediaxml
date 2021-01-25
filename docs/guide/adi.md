The **mediaxml** module provides an implementation for the
**_Asset Delivery Interface (ADI)**_ XML format. The format is based on the
_CableLabs 1.1 Content Metadata Specification_

### Example Usage

_See [example ADI XML document](#adi-example-xml-document)._

```js
const adi = require('mediaxml/adi')
const fs = require('fs')

const stream = fs.createReadStream('package.xml')
const document = adi.createDocument(stream)

document.ready(() => {
  console.log(document.metadata.appData) // ADI > Metadata > App_Data
  console.log(document.metadata.ams.provider) // ADI > Metadata > AMS > .provider })
```

### Basic API

The basic API is very similar to the other [MediaXML modules](#mediaxml-api).
The `mediaxml/adi` module provides a canonical `Document` class that is
the root of the ADI XML implementation. The various other classes
provided by the `mediaxml/adi` module have accessors for properties
defined by ADI that give normalized values in a convenient manner such
as a SMPTE timecode in an `App_Data` `Value` attribute normalized to a
[`SMPTETimecde`](https://github.com/CrystalComputerCorp/smpte-timecode).

#### `Document`

A class that represents an ADI XML document.

```js
const { createDocument } = require('mediaxml/adi')
const fs = require('fs')

const stream = fs.createReadStream('package.xml')
const document = createDocument(stream)

document.ready(() => {
  // A container for `<Metadata />
  console.log(document.metadata)

  // A container for `<Asset />
  console.log(document.asset)

  // computed `<AMS />` (Asset Management Service) node for this ADI metadata.
  console.log(document.metadata.ams)

  // computed `<App_Data />` for this ADI metadata node. If none could be found
  // then an empty array is given.
  console.log(document.metadata.appData)
})
```

##### See Also

* [ADI API](#adi)

<a name="adi-example-xml-document"></a>
### Example XML Document

```xml
<?xml version="1.0" encoding="ISO-8859-1" standalone="yes"?>
<!DOCTYPE ADI SYSTEM "ADI.DTD">
<ADI>
  <Metadata>
    <AMS Asset_Class="package" Product="SVOD" Provider="LIFETIMEMOVIECLUB_HD_UNIFIED" Provider_ID="mylifetime.com" Verb="" Version_Major="3" Version_Minor="0" Creation_Date="2020-09-29" Description="AcquiredMovie_FriendsWhoKill_241958-package" Asset_ID="LFHP2419582007240000" Asset_Name="LFHP2419582007240000_AMVE_HD" />
    <App_Data App="SVOD" Name="Metadata_Spec_Version" Value="CableLabsVOD1.1" />
    <App_Data App="SVOD" Name="Provider_Content_Tier" Value="LIFETIMEMOVIECLUB_HD_UNIFIED" />
  </Metadata>
  <Asset>
    <Metadata>
      <AMS Asset_Class="title" Product="SVOD" Provider="LIFETIMEMOVIECLUB_HD_UNIFIED" Provider_ID="mylifetime.com" Verb="" Version_Major="3" Version_Minor="0" Creation_Date="2020-09-29" Description="AcquiredMovie_FriendsWhoKill_241958-title" Asset_ID="LFHT2419582007240000" Asset_Name="LFHT2419582007240000_AMVE_HD" />
      <App_Data App="SVOD" Name="Type" Value="title" />
      <App_Data App="SVOD" Name="Network" Value="Lifetime" />
      <App_Data App="SVOD" Name="Series_Name" Value="Friends Who Kill" />
      <App_Data App="SVOD" Name="Title" Value="Friends Who Kill HD" />
      <App_Data App="SVOD" Name="Title_DirecTV" Value="Friends Who Kill" />
      <App_Data App="SVOD" Name="Title_SD" Value="Friends Who Kill" />
      <App_Data App="SVOD" Name="Episode_Name" Value="Friends Who Kill" />
      <App_Data App="SVOD" Name="Episode_Title" Value="Friends Who Kill" />
      <App_Data App="SVOD" Name="Title_Brief" Value="Friends Who Kill HD" />
      <App_Data App="SVOD" Name="Title_Brief_SD" Value="Friends Who Kill" />
      <App_Data App="SVOD" Name="Season_Name" Value="Friends Who Kill Season 1" />
      <App_Data App="SVOD" Name="Licensing_Window_Start" Value="2020-08-07" />
      <App_Data App="SVOD" Name="Licensing_Window_End" Value="2020-12-31" />
      <App_Data App="SVOD" Name="Licensing_Window_End_Comcast" Value="2020-12-31" />
      <App_Data App="SVOD" Name="Summary_Short" Value="Starring Natalie Brown. Hope's daughter Lacy brings home a new friend, Cassie. But Cassie is a lot more dangerous than she appears." />
      <App_Data App="SVOD" Name="Summary_Medium" Value="Starring Natalie Brown. Hope's daughter Lacy brings home a new friend, Cassie, driving a wedge between Lacy and her other friend, Harper. But Cassie is a lot more dangerous than she appears." />
      <App_Data App="SVOD" Name="Summary_VOD_HD" Value="Starring Natalie Brown. Hope's daughter Lacy brings home a new friend, Cassie. But Cassie is a lot more dangerous than she appears. HD" />
      <App_Data App="SVOD" Name="Summary_VOD_SD" Value="Starring Natalie Brown. Hope's daughter Lacy brings home a new friend, Cassie. But Cassie is a lot more dangerous than she appears." />
      <App_Data App="SVOD" Name="Series_Description_Short" Value="Starring Natalie Brown. Hope's daughter Lacy brings home a new friend, Cassie. But Cassie is a lot more dangerous than she appears." />
      <App_Data App="SVOD" Name="Series_Description_Long" Value="Starring Natalie Brown. Hope's daughter Lacy brings home a new friend, Cassie, driving a wedge between Lacy and her other friend, Harper. But Cassie is a lot more dangerous than she appears." />
      <App_Data App="SVOD" Name="Category" Value="Lifetime Movie Club/All Movies" />
      <App_Data App="SVOD" Name="Category_DirecTV" Value="Lifetime Movie Club/All Movies" />
      <App_Data App="SVOD" Name="Category" Value="Lifetime Movie Club/Teen" />
      <App_Data App="SVOD" Name="Category_DirecTV" Value="Lifetime Movie Club/Teen" />
      <App_Data App="SVOD" Name="Category" Value="Lifetime Movie Club/Suspense" />
      <App_Data App="SVOD" Name="Category_DirecTV" Value="Lifetime Movie Club/Suspense" />
      <App_Data App="SVOD" Name="Guide_Category" Value="Movies;Drama;Suspense;Romance" />
      <App_Data App="SVOD" Name="Season_Number" Value="1" />
      <App_Data App="SVOD" Name="Episode_Number" Value="1" />
      <App_Data App="SVOD" Name="TMS_ID" Value="MV013722230000" />
      <App_Data App="SVOD" Name="OTT_Rights" Value="Y" />
      <App_Data App="SVOD" Name="Original_Start_Date" Value="2020-01-23" />
      <App_Data App="SVOD" Name="Propagation_Priority" Value="5" />
      <App_Data App="SVOD" Name="Show_Type" Value="Movie" />
      <App_Data App="SVOD" Name="Run_Time" Value="01:00:00" />
      <App_Data App="SVOD" Name="Display_Run_Time" Value="01:00" />
      <App_Data App="SVOD" Name="Preview_Period" Value="600" />
      <App_Data App="SVOD" Name="Display_As_New" Value="4" />
      <App_Data App="SVOD" Name="Display_As_Last_Chance" Value="7" />
      <App_Data App="SVOD" Name="Billing_ID" Value="00000" />
      <App_Data App="SVOD" Name="AD_Content_ID" Value="241958" />
      <App_Data App="SVOD" Name="Rating" Value="TV-14" />
      <App_Data App="SVOD" Name="Advisories" Value="V" />
      <App_Data App="SVOD" Name="Maximum_Viewing_Length" Value="00:24:00" />
      <App_Data App="SVOD" Name="Provider_QA_Contact" Value="digital_qc@aenetworks.com" />
      <App_Data App="SVOD" Name="Year" Value="2020" />
      <App_Data App="SVOD" Name="Closed_Captioning" Value="Y" />
      <App_Data App="SVOD" Name="Genre" Value="Thrillers" />
      <App_Data App="SVOD" Name="Apple_Genre" Value="Thriller, Drama" />
      <App_Data App="SVOD" Name="Suggested_Price" Value="0.00" />
      <App_Data App="SVOD" Name="Tag" Value="Friends Who Kill" />
      <App_Data App="SVOD" Name="Tag" Value="killer friends" />
      <App_Data App="SVOD" Name="Tag" Value="best friends" />
      <App_Data App="SVOD" Name="Tag" Value="friends" />
      <App_Data App="SVOD" Name="Tag" Value="dark past" />
      <App_Data App="SVOD" Name="Tag" Value="teen girl" />
      <App_Data App="SVOD" Name="Tag" Value="jealousy" />
      <App_Data App="SVOD" Name="Tag" Value="Natalie Brown" />
      <App_Data App="SVOD" Name="Tag" Value="Sarah Fisher" />
      <App_Data App="SVOD" Name="Tag" Value="Alexa Rose Steele" />
      <App_Data App="SVOD" Name="Tag" Value="Reha Sandill" />
      <App_Data App="SVOD" Name="Tag" Value="bff" />
      <App_Data App="SVOD" Name="Episode_Vendor_ID" Value="241958AMVE_E001" />
      <App_Data App="SVOD" Name="Content_ID" Value="241958AMVE_E001" />
      <App_Data App="SVOD" Name="Producer" Value="MarVista Entertainment, Inc." />
    </Metadata>
    <Asset>
      <Metadata>
        <AMS Asset_Class="movie" Product="SVOD" Provider="LIFETIMEMOVIECLUB_HD_UNIFIED" Provider_ID="mylifetime.com" Verb="" Version_Major="3" Version_Minor="0" Creation_Date="2020-09-29" Description="AcquiredMovie_FriendsWhoKill_241958-movie" Asset_ID="LFHM2419582007240000" Asset_Name="LFHM2419582007240000_AMVE_HD" />
        <App_Data App="SVOD" Name="Type" Value="movie_svod" />
        <App_Data App="SVOD" Name="HDContent" Value="Y" />
        <App_Data App="SVOD" Name="Frame_Rate" Value="2398" />
        <App_Data App="SVOD" Name="Start_Of_Media" Value="01:00:00:00" />
        <App_Data App="SVOD" Name="End_Of_Media" Value="02:26:44:19" />
        <App_Data App="SVOD" Name="SourceProgramSegment1" In="01:00:00:00" Out="01:20:30:17" />
        <App_Data App="SVOD" Name="SourceProgramSegment2" In="01:20:32:18" Out="01:27:28:14" />
        <App_Data App="SVOD" Name="SourceProgramSegment3" In="01:27:30:15" Out="01:37:48:14" />
        <App_Data App="SVOD" Name="SourceProgramSegment4" In="01:37:50:15" Out="01:47:58:15" />
        <App_Data App="SVOD" Name="SourceProgramSegment5" In="01:48:00:16" Out="01:54:51:08" />
        <App_Data App="SVOD" Name="SourceProgramSegment6" In="01:54:53:09" Out="02:01:09:16" />
        <App_Data App="SVOD" Name="SourceProgramSegment7" In="02:01:11:17" Out="02:11:42:02" />
        <App_Data App="SVOD" Name="SourceProgramSegment8" In="02:11:44:03" Out="02:20:12:21" />
        <App_Data App="SVOD" Name="SourceProgramSegment9" In="02:20:14:22" Out="02:26:44:19" />
      </Metadata>
      <Content Value="LFHM2419582007240000_AMVE_HD.mxf" />
    </Asset>
    <Asset>
      <Metadata>
        <AMS Asset_Class="poster" Product="SVOD" Provider="LIFETIMEMOVIECLUB_HD_UNIFIED" Provider_ID="mylifetime.com" Verb="" Version_Major="3" Version_Minor="0" Creation_Date="2020-09-29" Description="AcquiredMovie_FriendsWhoKill_241958-poster" Asset_ID="LFHI2419582007240000" Asset_Name="LFHI2419582007240000_AMVE_HD" />
        <App_Data App="SVOD" Name="Type" Value="SVOD_EPISODIC_POSTER_800X450" />
      </Metadata>
      <Content Value="LFHM2419582007240000_AMVE_HD_EPISODIC_800X450.jpg" />
    </Asset>
    <Asset>
      <Metadata>
        <AMS Asset_Class="poster" Product="SVOD" Provider="LIFETIMEMOVIECLUB_HD_UNIFIED" Provider_ID="mylifetime.com" Verb="" Version_Major="3" Version_Minor="0" Creation_Date="2020-09-29" Description="AcquiredMovie_FriendsWhoKill_241958-poster" Asset_ID="LFHZ2419582007240000" Asset_Name="LFHZ2419582007240000_AMVE_HD" />
        <App_Data App="SVOD" Name="Type" Value="SVOD_EPISODIC_POSTER_1920X1080" />
      </Metadata>
      <Content Value="LFHM2419582007240000_AMVE_HD_EPISODIC_1920X1080.jpg" />
    </Asset>
    <Asset>
      <Metadata>
        <AMS Asset_Class="poster" Product="SVOD" Provider="LIFETIMEMOVIECLUB_HD_UNIFIED" Provider_ID="mylifetime.com" Verb="" Version_Major="3" Version_Minor="0" Creation_Date="2020-09-29" Description="AcquiredMovie_FriendsWhoKill_241958-box cover" Asset_ID="LFHV2419582007240000" Asset_Name="LFHV2419582007240000_AMVE_HD" />
        <App_Data App="SVOD" Name="Type" Value="SVOD_SEASON_POSTER" />
      </Metadata>
      <Content Value="LFHM2419582007240000_AMVE_HD_SEASON.jpg" />
    </Asset>
    <Asset>
      <Metadata>
        <AMS Asset_Class="poster" Product="SVOD" Provider="LIFETIMEMOVIECLUB_HD_UNIFIED" Provider_ID="mylifetime.com" Verb="" Version_Major="3" Version_Minor="0" Creation_Date="2020-09-29" Description="AcquiredMovie_FriendsWhoKill_241958-box cover" Asset_ID="LFHX2419582007240000" Asset_Name="LFHX2419582007240000_AMVE_HD" />
        <App_Data App="SVOD" Name="Type" Value="SVOD_SEASON_POSTER_288X432" />
      </Metadata>
      <Content Value="LFHM2419582007240000_AMVE_HD_SEASON_288X432.jpg" />
    </Asset>
  </Asset>
</ADI>
```

### See Also

  * [CableLabs 1.1 ADI Specification](https://community.cablelabs.com/wiki/plugins/servlet/cablelabs/alfresco/download?id=8f900e8b-d1eb-4834-bd26-f04bd623c3d2)
