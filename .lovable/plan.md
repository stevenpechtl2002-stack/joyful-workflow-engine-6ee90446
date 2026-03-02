

## Problem Analysis

After investigating the code and database, I found the issue:

When you upload a **Logo** or **Cover-Bild** on the Salon-Profil page, the image file is uploaded to storage successfully, but the **URL is only saved in the browser's temporary state** (React state). The URL is **not automatically saved to the database**. You must manually click "Salon-Profil speichern" at the bottom of the page after every image upload.

This is confusing and error-prone -- if you navigate away without clicking save, the uploaded image URL is lost (the file exists in storage but the database doesn't know about it).

**Database confirms this:** Your cover image URL is saved (you probably clicked save after uploading it), but no logo URL exists in the database.

## Proposed Fix

**Auto-save image URLs to the database immediately after upload**, so users don't have to remember to click "save" separately.

### Changes to `src/pages/portal/SalonProfile.tsx`:
1. In `handleLogoUpload`: After successfully uploading the file and getting the public URL, immediately update the `customers` table with the new `logo_url` (in addition to updating local state)
2. In `handleCoverUpload`: Same -- immediately update the `customers` table with the new `cover_image_url`
3. When the user clicks the X to remove a cover image, also immediately persist that removal to the database

### Changes to `src/components/portal/SalonImageManager.tsx`:
4. Remove the duplicate "Salon-Beschreibung" Card section, since `SalonProfile.tsx` already has a description field -- this avoids confusion about which description field is authoritative

No database or Edge Function changes are needed.

