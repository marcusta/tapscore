import CoreLocation

/// One coarse position fix for the create flow, as an async call.
///
/// The flow wants a single answer to "roughly where is this phone?" — enough
/// to sort a course list — so this asks for kilometre accuracy, resolves nil
/// on denial or failure, and never throws. The permission prompt appears on
/// the first create flow of a fresh install; every outcome, including "never
/// asked because Location Services are off", degrades to nil and the picker
/// simply keeps the server's order.
@MainActor
final class CourseLocator: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var continuation: CheckedContinuation<GeoPoint?, Never>?

    /// Resolve one fix, or nil. Safe to call once per instance — the create
    /// flow makes a locator, awaits it, and lets it go.
    func currentFix() async -> GeoPoint? {
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
        return await withCheckedContinuation { continuation in
            self.continuation = continuation
            switch manager.authorizationStatus {
            case .notDetermined:
                // The answer arrives in the authorization callback below.
                manager.requestWhenInUseAuthorization()
            case .authorizedWhenInUse, .authorizedAlways:
                manager.requestLocation()
            default:
                resolve(nil)
            }
        }
    }

    private func resolve(_ fix: GeoPoint?) {
        continuation?.resume(returning: fix)
        continuation = nil
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            guard self.continuation != nil else { return }
            switch status {
            case .authorizedWhenInUse, .authorizedAlways:
                self.manager.requestLocation()
            case .notDetermined:
                // The prompt is still up; the next callback decides.
                break
            default:
                self.resolve(nil)
            }
        }
    }

    nonisolated func locationManager(
        _ manager: CLLocationManager,
        didUpdateLocations locations: [CLLocation]
    ) {
        let coordinate = locations.last?.coordinate
        Task { @MainActor in
            self.resolve(coordinate.map {
                GeoPoint(latitude: $0.latitude, longitude: $0.longitude)
            })
        }
    }

    nonisolated func locationManager(
        _ manager: CLLocationManager,
        didFailWithError error: Error
    ) {
        Task { @MainActor in self.resolve(nil) }
    }
}
