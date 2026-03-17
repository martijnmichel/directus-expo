#import <React/RCTBridgeModule.h>

static NSString *const kAppGroup = @"group.com.martijnmichel.directusexpo.widgets";
static NSString *const kConfigListKey = @"directus.widgets.latestItems.v1.configList";
static NSString *const kConfigListFileName = @"configList.json";
static NSString *const kPayloadPrefix = @"directus.widgets.latestItems.v1.payload.";

@interface WidgetSharedStorage : NSObject <RCTBridgeModule>
@end

@implementation WidgetSharedStorage

RCT_EXPORT_MODULE(WidgetSharedStorage)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(setConfigList:(NSString *)json
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:kAppGroup];
  if (!defaults) {
    reject(@"APP_GROUP", @"App Group not available", nil);
    return;
  }
  NSString *value = json ?: @"";
  [defaults setObject:value forKey:kConfigListKey];
  [defaults synchronize];
  NSURL *containerURL = [[NSFileManager defaultManager] containerURLForSecurityApplicationGroupIdentifier:kAppGroup];
  if (containerURL) {
    NSURL *fileURL = [containerURL URLByAppendingPathComponent:kConfigListFileName];
    [value writeToURL:fileURL atomically:YES encoding:NSUTF8StringEncoding error:NULL];
  }
  resolve(nil);
}

RCT_EXPORT_METHOD(getConfigListFromAppGroup:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:kAppGroup];
  if (!defaults) {
    reject(@"APP_GROUP", @"App Group not available", nil);
    return;
  }
  NSString *raw = [defaults stringForKey:kConfigListKey];
  NSUInteger length = raw.length;
  NSInteger count = 0;
  NSMutableArray *ids = [NSMutableArray array];
  if (raw.length > 0 && [raw isKindOfClass:[NSString class]]) {
    NSData *data = [raw dataUsingEncoding:NSUTF8StringEncoding];
    if (data) {
      id json = [NSJSONSerialization JSONObjectWithData:data options:0 error:NULL];
      if ([json isKindOfClass:[NSArray class]]) {
        NSArray *arr = (NSArray *)json;
        count = [arr count];
        for (id item in arr) {
          if ([item isKindOfClass:[NSDictionary class]]) {
            NSString *idVal = [(NSDictionary *)item objectForKey:@"id"];
            if ([idVal isKindOfClass:[NSString class]] && idVal.length > 0) {
              [ids addObject:idVal];
            }
          }
        }
      }
    }
  }
  resolve(@{ @"length": @(length), @"count": @(count), @"ids": ids });
}

RCT_EXPORT_METHOD(setPayload:(NSString *)id
                  json:(NSString *)json
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  if (id == nil || id.length == 0) {
    reject(@"INVALID_ID", @"config id must be a non-empty string", nil);
    return;
  }
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName:kAppGroup];
  if (!defaults) {
    reject(@"APP_GROUP", @"App Group not available", nil);
    return;
  }
  NSString *key = [kPayloadPrefix stringByAppendingString:id];
  if (json != nil) {
    [defaults setObject:json forKey:key];
  } else {
    [defaults removeObjectForKey:key];
  }
  [defaults synchronize];
  resolve(nil);
}

@end
